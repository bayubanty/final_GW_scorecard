// ===============================
// Data Storage
// ===============================

let hospitalData = [];
let filteredHospitalData = [];
let currentFilters = {
    hospitalType: [],
    metrics: [],
    location: null,
    radius: 10,
    view: 'individuals',
    hospitalSubType: null
};

// ===============================
// Load JSON Data
// ===============================

fetch("./data/2025/2025_Lown_Index_GA.json")
    .then(res => res.json())
    .then(data => {
        hospitalData = data;
        filteredHospitalData = [...hospitalData];
        console.log("Hospital data loaded:", hospitalData.length, "records");

        // Initial render
        applyAllFilters();
        initHospitalMap(filteredHospitalData);
    })
    .catch(err => console.error("Error loading JSON:", err));

// ===============================
// Filtering Functions - ORIGINAL CODE
// ===============================

function applyAllFilters() {
    let filtered = [...hospitalData];

    // Apply hospital type filters
    if (currentFilters.hospitalType.length > 0) {
        filtered = filtered.filter(hospital => {
            return currentFilters.hospitalType.some(filter => {
                switch(filter) {
                    case 'Urban': return hospital.TYPE_urban === 1;
                    case 'Rural': return hospital.TYPE_rural === 1;
                    case 'Non-profit': return hospital.TYPE_NonProfit === 1;
                    case 'For Profit': return hospital.TYPE_ForProfit === 1;
                    case 'Church Affiliated': return hospital.TYPE_chrch_affl_f === 1;
                    case 'Academic Medical Center': return hospital.TYPE_AMC === 1;
                    case 'Safety Net': return hospital.TYPE_isSafetyNet === 1;
                    default: return false;
                }
            });
        });
    }

    // Apply hospital sub-type filter (Critical Access vs Acute Care)
    if (currentFilters.hospitalSubType) {
        filtered = filtered.filter(hospital => {
            if (currentFilters.hospitalSubType === 'Critical Access') {
                return hospital.TYPE_HospTyp_CAH === 1;
            } else if (currentFilters.hospitalSubType === 'Acute Care') {
                return hospital.TYPE_HospTyp_ACH === 1;
            }
            return true;
        });
    }

    // Apply metric category filters
    if (currentFilters.metrics.length > 0) {
        filtered = filtered.filter(hospital => {
            return currentFilters.metrics.some(metric => {
                switch(metric) {
                    case 'Financial Transparency and Institutional Health':
                        return (hospital.TIER_2_GRADE_Value && hospital.TIER_2_GRADE_Value !== 'N/A') ||
                               (hospital.TIER_3_GRADE_Cost_Eff && hospital.TIER_3_GRADE_Cost_Eff !== 'N/A');
                    case 'Community Benefit Spending':
                        return hospital.TIER_3_GRADE_CB && hospital.TIER_3_GRADE_CB !== 'N/A';
                    case 'Healthcare Affordability and Billing':
                        return hospital.TIER_3_GRADE_Cost_Eff && hospital.TIER_3_GRADE_Cost_Eff !== 'N/A';
                    case 'Healthcare Access and Social Responsibility':
                        return hospital.TIER_3_GRADE_Inclusivity && hospital.TIER_3_GRADE_Inclusivity !== 'N/A';
                    default: return false;
                }
            });
        });
    }

    // Apply location filter
    if (currentFilters.location) {
        filtered = filtered.filter(hospital => {
            const distance = calculateDistance(
                currentFilters.location.lat,
                currentFilters.location.lng,
                hospital.Latitude || getZipCoords(hospital.Zip)[0],
                hospital.Longitude || getZipCoords(hospital.Zip)[1]
            );
            return distance <= currentFilters.radius;
        });
    }

    filteredHospitalData = filtered;
    renderHospitals(filteredHospitalData);
    updateMapMarkers(filteredHospitalData);
}

// ===============================
// Location Functions - ORIGINAL CODE
// ===============================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getZipCoords(zip) {
    // Basic GA ZIP-to-lat/lon lookup (approximate centers)
    const lookup = {
        "30303": [33.7525, -84.3915], // Atlanta
        "30720": [34.7698, -84.9719], // Dalton
        "31201": [32.8306, -83.6513], // Macon
        "31901": [32.464, -84.9877], // Columbus
        "31401": [32.0809, -81.0912], // Savannah
        "31520": [31.1499, -81.4915], // Brunswick
        "31701": [31.5795, -84.1557], // Albany
        "39817": [30.9043, -84.5762], // Bainbridge
        "30601": [33.959, -83.3767], // Athens
        "30161": [34.2546, -85.1647], // Rome
        "30501": [34.2963, -83.8255], // Gainesville
        "30553": [34.4359, -83.1067], // Lavonia
        "30117": [33.5801, -85.0767], // Carrollton
        "31093": [32.6184, -83.6272], // Warner Robins
        "31405": [32.0316, -81.1028], // Savannah
        "31021": [32.5563, -82.8947], // Dublin
        "31792": [30.8365, -83.9787] // Thomasville
    };
    const coords = lookup[String(zip)] || [32.5, -83.5];
    return coords;
}

// ===============================
// Sorting Functions - ORIGINAL CODE
// ===============================

function sortHospitals(data) {
    const sortValue = document.getElementById("sortSelect").value;
    let sorted = [...data];
    switch(sortValue) {
        case "grade":
            sorted.sort((a, b) => {
                const gradeOrder = {"A+": 12, "A": 11, "A-": 10, "B+": 9, "B": 8, "B-": 7, "C+": 6, "C": 5, "C-": 4, "D+": 3, "D": 2, "D-": 1, "F": 0, "N/A": -1};
                const gradeA = a.TIER_1_GRADE_Lown_Composite || "N/A";
                const gradeB = b.TIER_1_GRADE_Lown_Composite || "N/A";
                return gradeOrder[gradeB] - gradeOrder[gradeA];
            });
            break;
        case "distance":
            if (currentFilters.location) {
                sorted.sort((a, b) => {
                    const distA = calculateDistance(
                        currentFilters.location.lat,
                        currentFilters.location.lng,
                        a.Latitude || getZipCoords(a.Zip)[0],
                        a.Longitude || getZipCoords(a.Zip)[1]
                    );
                    const distB = calculateDistance(
                        currentFilters.location.lat,
                        currentFilters.location.lng,
                        b.Latitude || getZipCoords(b.Zip)[0],
                        b.Longitude || getZipCoords(b.Zip)[1]
                    );
                    return distA - distB;
                });
            }
            break;
        case "name":
            sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
            break;
        case "size":
            const sizeOrder = {"xs": 1, "s": 2, "m": 3, "l": 4, "xl": 5};
            sorted.sort((a, b) => {
                const sizeA = sizeOrder[a.Size] || 0;
                const sizeB = sizeOrder[b.Size] || 0;
                return sizeB - sizeA; // Largest first
            });
            break;
    }
    return sorted;
}

// ===============================
// Render Hospitals - ORIGINAL CODE
// ===============================

function renderHospitals(data) {
    const resultsTable = document.getElementById("hospitalResults");
    const resultsCount = document.getElementById("resultsCount");

    // Clear old results
    resultsTable.innerHTML = "";

    // Sort data
    const sortedData = sortHospitals(data);

    // Update results count
    resultsCount.textContent = `Viewing ${sortedData.length} results`;

    if (!sortedData.length) {
        resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
        return;
    }

    sortedData.forEach(hospital => {
        // Convert letter grade to star rating
        const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
        const stars = convertGradeToStars(grade);

        // === Main Row ===
        const row = document.createElement("tr");
        row.classList.add("hospital-row");

        const gradeCell = document.createElement("td");
        gradeCell.innerHTML = `
            <div class="star-rating" aria-label="${stars.value} out of 5 stars">
                ${renderStars(stars.value)}
            </div>
        `;
        row.appendChild(gradeCell);

        const nameCell = document.createElement("td");
        nameCell.innerHTML = `
            <strong>
                <a href="details.html?id=${hospital.RECORD_ID}" class="hospital-link">
                    ${hospital.Name || "Unnamed Hospital"}
                </a>
            </strong><br>
            ${hospital.City || ""}, ${hospital.State || ""}<br>
            <small class="hospital-meta">
                ${getHospitalTypeText(hospital)} • ${getSizeText(hospital.Size)} • ${getUrbanRuralText(hospital)}
            </small>
        `;
        row.appendChild(nameCell);

        // === Buttons ===
        const buttonCell = document.createElement("td");
        buttonCell.classList.add("details-buttons");

        const detailsButton = document.createElement("button");
        detailsButton.textContent = "View Details ▼";
        detailsButton.classList.add("toggle-detail");

        const fullDetailsButton = document.createElement("button");
        fullDetailsButton.textContent = "View Full Details";
        fullDetailsButton.classList.add("view-full-detail");
        fullDetailsButton.addEventListener("click", () => {
            if (hospital.RECORD_ID) {
                window.location.href = `details.html?id=${hospital.RECORD_ID}`;
            } else {
                showErrorPopup("Sorry, we couldn't find more details for this hospital.");
            }
        });

        buttonCell.appendChild(detailsButton);
        buttonCell.appendChild(fullDetailsButton);
        row.appendChild(buttonCell);

        // === Detail Row (collapsed preview) ===
        const detailRow = document.createElement("tr");
        detailRow.classList.add("hospital-detail-row");
        detailRow.style.display = "none";

        const detailCell = document.createElement("td");
        detailCell.colSpan = 3;
        detailCell.innerHTML = `
            <div class="detail-info">
                <div class="detail-metrics">
                    <p class="inline-stars"><strong>Outcome:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Outcome || "F").value)}</p>
                    <p class="inline-stars"><strong>Value:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Value || "F").value)}</p>
                    <p class="inline-stars"><strong>Civic:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Civic || "F").value)}</p>
                    <p class="inline-stars"><strong>Safety:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Saf || "F").value)}</p>
                    <p class="inline-stars"><strong>Experience:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Exp || "F").value)}</p>
                </div>
                <div class="detail-additional">
                    <p><strong>System:</strong> ${hospital.SYSTEM_NAME || "Independent"}</p>
                    <p><strong>County:</strong> ${hospital.County || "N/A"}</p>
                    <p><strong>Services:</strong> ${hospital.SERVICES ? hospital.SERVICES.split(',').slice(0, 3).join(', ') : "General Care"}</p>
                </div>
            </div>
        `;

        detailRow.appendChild(detailCell);

        // === Toggle Logic ===
        detailsButton.addEventListener("click", () => {
            const isHidden = detailRow.style.display === "none" || detailRow.style.display === "";
            detailRow.style.display = isHidden ? "table-row" : "none";
            detailsButton.textContent = isHidden ? "Hide Details ▲" : "View Details ▼";
        });

        // === Append both rows ===
        resultsTable.appendChild(row);
        resultsTable.appendChild(detailRow);
    });
}

// Helper functions for display text - ORIGINAL CODE
function getHospitalTypeText(hospital) {
    const types = [];
    if (hospital.TYPE_HospTyp_CAH === 1) types.push("Critical Access");
    if (hospital.TYPE_HospTyp_ACH === 1) types.push("Acute Care");
    if (hospital.TYPE_AMC === 1) types.push("Academic");
    if (hospital.TYPE_NonProfit === 1) types.push("Non-profit");
    if (hospital.TYPE_ForProfit === 1) types.push("For Profit");
    if (hospital.TYPE_chrch_affl_f === 1) types.push("Faith-based");
    return types.length > 0 ? types[0] : "Hospital";
}

function getSizeText(size) {
    const sizeMap = {
        "xs": "Extra Small",
        "s": "Small",
        "m": "Medium",
        "l": "Large",
        "xl": "Extra Large"
    };
    return sizeMap[size] || "Unknown Size";
}

function getUrbanRuralText(hospital) {
    if (hospital.TYPE_urban === 1) return "Urban";
    if (hospital.TYPE_rural === 1) return "Rural";
    return "Unknown";
}

// ===============================
// Event Listeners Setup - ORIGINAL CODE
// ===============================

function setupEventListeners() {
    // View toggle buttons
    const viewSystemsBtn = document.getElementById("viewSystemsBtn");
    const viewIndividualsBtn = document.getElementById("viewIndividualsBtn");
    const individualOptions = document.getElementById("individualOptions");

    if (viewSystemsBtn && viewIndividualsBtn) {
        viewSystemsBtn.addEventListener("click", () => {
            currentFilters.view = 'systems';
            viewSystemsBtn.classList.add("active");
            viewIndividualsBtn.classList.remove("active");
            individualOptions.style.display = "none";
            applyAllFilters();
        });

        viewIndividualsBtn.addEventListener("click", () => {
            currentFilters.view = 'individuals';
            viewIndividualsBtn.classList.add("active");
            viewSystemsBtn.classList.remove("active");
            individualOptions.style.display = "block";
            applyAllFilters();
        });
    }

    // Hospital type sub-filters
    const filterCriticalBtn = document.getElementById("filterCriticalBtn");
    const filterAcuteBtn = document.getElementById("filterAcuteBtn");

    if (filterCriticalBtn && filterAcuteBtn) {
        filterCriticalBtn.addEventListener("click", () => {
            const isActive = filterCriticalBtn.classList.contains("active");
            filterCriticalBtn.classList.toggle("active", !isActive);
            filterAcuteBtn.classList.remove("active");
            if (!isActive) {
                currentFilters.hospitalSubType = 'Critical Access';
            } else {
                currentFilters.hospitalSubType = null;
            }
            applyAllFilters();
        });

        filterAcuteBtn.addEventListener("click", () => {
            const isActive = filterAcuteBtn.classList.contains("active");
            filterAcuteBtn.classList.toggle("active", !isActive);
            filterCriticalBtn.classList.remove("active");
            if (!isActive) {
                currentFilters.hospitalSubType = 'Acute Care';
            } else {
                currentFilters.hospitalSubType = null;
            }
            applyAllFilters();
        });
    }

    // Hospital type checkboxes
    const hospitalTypeCheckboxes = document.querySelectorAll('input[value="Urban"], input[value="Rural"], input[value="Non-profit"], input[value="For Profit"], input[value="Church Affiliated"], input[value="Academic Medical Center"], input[value="Safety Net"]');

    hospitalTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            currentFilters.hospitalType = Array.from(hospitalTypeCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            applyAllFilters();
        });
    });

    // Metric category checkboxes
    const metricCheckboxes = document.querySelectorAll('input[value="Financial Transparency and Institutional Health"], input[value="Community Benefit Spending"], input[value="Healthcare Affordability and Billing"], input[value="Healthcare Access and Social Responsibility"]');

    metricCheckboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            currentFilters.metrics = Array.from(metricCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            applyAllFilters();
        });
    });

    // Location search
    const applyLocationBtn = document.getElementById("applyLocationBtn");
    if (applyLocationBtn) {
        applyLocationBtn.addEventListener("click", () => {
            const zipInput = document.getElementById("zipInput").value.trim();
            const radiusSelect = document.getElementById("radiusSelect");
            currentFilters.radius = parseInt(radiusSelect.value);
            if (zipInput && /^\d{5}$/.test(zipInput)) {
                // Simple ZIP code to coordinates mapping
                const coords = getZipCoords(zipInput);
                currentFilters.location = { lat: coords[0], lng: coords[1] };
                applyAllFilters();
            } else if (zipInput === "") {
                // Clear location filter
                currentFilters.location = null;
                applyAllFilters();
            } else {
                showErrorPopup("Please enter a valid 5-digit ZIP code.");
            }
        });
    }

    // Sort functionality
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            renderHospitals(filteredHospitalData);
        });
    }

    // Apply Filters button (legacy - now individual filters apply automatically)
    const applyFiltersBtn = document.getElementById("applyFiltersBtn");
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener("click", () => {
            applyAllFilters();
        });
    }

    // Reset Filters
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            resetAllFilters();
        });
    }

    // Download Data
    const downloadDataBtn = document.getElementById("downloadDataBtn");
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener("click", () => {
            downloadHospitalData();
        });
    }
}

function resetAllFilters() {
    // Reset all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Reset view to individuals
    const viewIndividualsBtn = document.getElementById("viewIndividualsBtn");
    if (viewIndividualsBtn) {
        viewIndividualsBtn.click();
    }

    // Reset hospital sub-type buttons
    const filterCriticalBtn = document.getElementById("filterCriticalBtn");
    const filterAcuteBtn = document.getElementById("filterAcuteBtn");
    if (filterCriticalBtn && filterAcuteBtn) {
        filterCriticalBtn.classList.remove("active");
        filterAcuteBtn.classList.remove("active");
    }

    // Reset location
    document.getElementById("zipInput").value = "";
    document.getElementById("radiusSelect").value = "10";

    // Reset sort
    const sortSelect = document.getElementById("sortSelect");
    if (sortSelect) {
        sortSelect.value = "grade";
    }

    // Clear all filters
    currentFilters = {
        hospitalType: [],
        metrics: [],
        location: null,
        radius: 10,
        view: 'individuals',
        hospitalSubType: null
    };

    applyAllFilters();
}

function downloadHospitalData() {
    // Create CSV content
    const headers = ["Name", "City", "State", "Overall Grade", "Type", "Size", "System"];
    const csvContent = [
        headers.join(","),
        ...filteredHospitalData.map(hospital => [
            `"${hospital.Name || ''}"`,
            `"${hospital.City || ''}"`,
            `"${hospital.State || ''}"`,
            `"${hospital.TIER_1_GRADE_Lown_Composite || 'N/A'}"`,
            `"${getHospitalTypeText(hospital)}"`,
            `"${getSizeText(hospital.Size)}"`,
            `"${hospital.SYSTEM_NAME || 'Independent'}"`
        ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "georgia_hospitals_filtered.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showSuccessPopup("Data downloaded successfully!");
}

function showSuccessPopup(message) {
    const popup = document.createElement("div");
    popup.className = "success-popup";
    popup.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("visible"), 10);
    setTimeout(() => {
        popup.classList.remove("visible");
        setTimeout(() => popup.remove(), 400);
    }, 3000);
}

// ===============================
// Map Functions - ORIGINAL CODE
// ===============================

let map;
let mapMarkers = [];

function initHospitalMap(data) {
    const mapDiv = document.getElementById("mainMap");
    if (!mapDiv) return;

    // Initialize only once
    if (!map) {
        map = L.map("mainMap").setView([32.7, -83.4], 7);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);
    }

    updateMapMarkers(data);
}

function updateMapMarkers(data) {
    // Clear old markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    // Add new markers
    data.forEach(hospital => {
        let lat = hospital.Latitude;
        let lon = hospital.Longitude;

        // If no coordinates, approximate from ZIP code
        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }

        if (!lat || !lon) return;

        const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <div class="map-popup">
                <strong>${hospital.Name || "Unnamed Hospital"}</strong><br>
                ${hospital.City || ""}, ${hospital.State || ""}<br>
                <div class="star-rating">${renderStars(stars.value)}</div>
                <p><strong>Type:</strong> ${getHospitalTypeText(hospital)}</p>
                <p><strong>Size:</strong> ${getSizeText(hospital.Size)}</p>
                <a href="details.html?id=${hospital.RECORD_ID}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    // Adjust map to fit all visible markers
    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
    } else {
        // Reset to Georgia default if no markers
        map.setView([32.1656, -82.9001], 7);
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}

// ===============================
// Star Rating Utilities - ORIGINAL CODE
// ===============================

function convertGradeToStars(grade) {
    const gradeMap = {
        "A+": 5, "A": 5, "A-": 4.5,
        "B+": 4.5, "B": 4, "B-": 3.5,
        "C+": 3.5, "C": 3, "C-": 2.5,
        "D+": 2.5, "D": 2, "D-": 1.5,
        "F": 1, "N/A": 0
    };
    const value = gradeMap[grade.trim()] || 0;
    return { value };
}

function renderStars(value) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
        if (value >= i) {
            html += fullStarSVG();
        } else if (value >= i - 0.5) {
            html += halfStarSVG();
        } else {
            html += emptyStarSVG();
        }
    }
    return html;
}

function fullStarSVG() {
    return `
        <svg class="star full" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
        </svg>
    `;
}

function halfStarSVG() {
    return `
        <svg class="star half" viewBox="0 0 24 24" aria-hidden="true">
            <defs>
                <linearGradient id="halfGradient" x1="0" x2="1">
                    <stop offset="50%" stop-color="#f48810" />
                    <stop offset="50%" stop-color="#a4cc95" />
                </linearGradient>
            </defs>
            <path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
        </svg>
    `;
}

function emptyStarSVG() {
    return `
        <svg class="star empty" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
        </svg>
    `;
}

// ===============================
// Error Popup Utility - ORIGINAL CODE
// ===============================

function showErrorPopup(message) {
    const popup = document.createElement("div");
    popup.className = "error-popup";
    popup.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("visible"), 10);
    setTimeout(() => {
        popup.classList.remove("visible");
        setTimeout(() => popup.remove(), 400);
    }, 4000);
}

// ===============================
// Initialize Application - ORIGINAL CODE
// ===============================

document.addEventListener("DOMContentLoaded", function() {
    setupEventListeners();
    // Set initial view to individuals
    const viewIndividualsBtn = document.getElementById("viewIndividualsBtn");
    if (viewIndividualsBtn) {
        viewIndividualsBtn.click();
    }
});
