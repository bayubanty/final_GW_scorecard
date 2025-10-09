// ===============================
// Data Storage and State
// ===============================
let hospitalData = [];
let filteredHospitalData = [];
let currentView = 'individuals'; // 'systems' or 'individuals'
let currentHospitalType = null; // 'Critical Access' or 'Acute Care'
let currentFilters = {
    hospitalTypes: [],
    metrics: [],
    location: null
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
    renderHospitals(filteredHospitalData);
    initHospitalMap(filteredHospitalData);
    setupEventListeners();

  })
  .catch(err => console.error("Error loading JSON:", err));

// ===============================
// Event Listeners Setup
// ===============================
function setupEventListeners() {
    // View Toggle Buttons
    document.getElementById("viewSystemsBtn").addEventListener("click", () => {
        setViewMode('systems');
    });

    document.getElementById("viewIndividualsBtn").addEventListener("click", () => {
        setViewMode('individuals');
    });

    // Hospital Type Buttons (Critical Access vs Acute Care)
    document.getElementById("filterCriticalBtn").addEventListener("click", () => {
        toggleHospitalType('Critical Access');
    });

    document.getElementById("filterAcuteBtn").addEventListener("click", () => {
        toggleHospitalType('Acute Care');
    });

    // Location Search
    document.getElementById("applyLocationBtn").addEventListener("click", applyLocationFilter);

    // Hospital Type Checkboxes
    const hospitalTypeCheckboxes = document.querySelectorAll('input[value="Urban"], input[value="Rural"], input[value="Non-profit"], input[value="For Profit"], input[value="Church Affiliated"], input[value="Academic Medical Center"], input[value="Safety Net"]');
    hospitalTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateHospitalTypeFilters);
    });

    // Metric Category Checkboxes
    const metricCheckboxes = document.querySelectorAll('input[value="Financial Transparency and Institutional Health"], input[value="Community Benefit Spending"], input[value="Healthcare Affordability and Billing"], input[value="Healthcare Access and Social Responsibility"]');
    metricCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateMetricFilters);
    });

    // Action Buttons
    document.getElementById("applyFiltersBtn").addEventListener("click", applyAllFilters);
    document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);
    document.getElementById("downloadDataBtn").addEventListener("click", downloadData);

    // Sort Select
    document.getElementById("sortSelect").addEventListener("change", handleSortChange);
}

// ===============================
// View Mode Management
// ===============================
function setViewMode(mode) {
    currentView = mode;
    
    // Update button states
    const systemsBtn = document.getElementById("viewSystemsBtn");
    const individualsBtn = document.getElementById("viewIndividualsBtn");
    const individualOptions = document.getElementById("individualOptions");

    if (mode === 'systems') {
        systemsBtn.classList.add("active");
        individualsBtn.classList.remove("active");
        individualOptions.style.display = "none";
        console.log("View set to: Hospital Systems");
        // TODO: Implement system-level rendering logic
    } else {
        systemsBtn.classList.remove("active");
        individualsBtn.classList.add("active");
        individualOptions.style.display = "block";
        console.log("View set to: Individual Hospitals");
    }

    applyAllFilters();
}

function toggleHospitalType(type) {
    const criticalBtn = document.getElementById("filterCriticalBtn");
    const acuteBtn = document.getElementById("filterAcuteBtn");

    if (currentHospitalType === type) {
        // Deselect if already selected
        currentHospitalType = null;
        criticalBtn.classList.remove("active");
        acuteBtn.classList.remove("active");
    } else {
        // Select new type
        currentHospitalType = type;
        if (type === 'Critical Access') {
            criticalBtn.classList.add("active");
            acuteBtn.classList.remove("active");
        } else {
            criticalBtn.classList.remove("active");
            acuteBtn.classList.add("active");
        }
    }

    console.log("Hospital type selected:", currentHospitalType);
    applyAllFilters();
}

// ===============================
// Filter Management
// ===============================
function updateHospitalTypeFilters() {
    const checkedBoxes = document.querySelectorAll('input[value="Urban"], input[value="Rural"], input[value="Non-profit"], input[value="For Profit"], input[value="Church Affiliated"], input[value="Academic Medical Center"], input[value="Safety Net"]:checked');
    currentFilters.hospitalTypes = Array.from(checkedBoxes).map(cb => cb.value);
    console.log("Hospital type filters updated:", currentFilters.hospitalTypes);
}

function updateMetricFilters() {
    const checkedBoxes = document.querySelectorAll('input[value="Financial Transparency and Institutional Health"], input[value="Community Benefit Spending"], input[value="Healthcare Affordability and Billing"], input[value="Healthcare Access and Social Responsibility"]:checked');
    currentFilters.metrics = Array.from(checkedBoxes).map(cb => cb.value);
    console.log("Metric filters updated:", currentFilters.metrics);
}

function applyLocationFilter() {
    const zipCode = document.getElementById("zipInput").value.trim();
    const radius = document.getElementById("radiusSelect").value;

    if (zipCode) {
        currentFilters.location = {
            zip: zipCode,
            radius: parseInt(radius)
        };
        console.log("Location filter applied:", currentFilters.location);
    } else {
        currentFilters.location = null;
        console.log("Location filter cleared");
    }

    applyAllFilters();
}

// ===============================
// Main Filter Application
// ===============================
function applyAllFilters() {
    let filtered = [...hospitalData];

    // Apply hospital type filters
    if (currentFilters.hospitalTypes.length > 0) {
        filtered = filtered.filter(hospital => {
            return currentFilters.hospitalTypes.some(filterType => {
                switch(filterType) {
                    case 'Urban':
                        return hospital.TYPE_urban === 1 || hospital.TYPE_urban === '1' || hospital.TYPE_urban === 'Y';
                    case 'Rural':
                        return hospital.TYPE_rural === 1 || hospital.TYPE_rural === '1' || hospital.TYPE_rural === 'Y';
                    case 'Non-profit':
                        return hospital.TYPE_NonProfit === 1 || hospital.TYPE_NonProfit === '1' || hospital.TYPE_NonProfit === 'Y';
                    case 'For Profit':
                        return hospital.TYPE_ForProfit === 1 || hospital.TYPE_ForProfit === '1' || hospital.TYPE_ForProfit === 'Y';
                    case 'Church Affiliated':
                        return hospital.TYPE_chrch_affl_f === 1 || hospital.TYPE_chrch_affl_f === '1' || hospital.TYPE_chrch_affl_f === 'Y';
                    case 'Academic Medical Center':
                        return hospital.TYPE_AMC === 1 || hospital.TYPE_AMC === '1' || hospital.TYPE_AMC === 'Y';
                    case 'Safety Net':
                        return hospital.TYPE_isSafetyNet === 1 || hospital.TYPE_isSafetyNet === '1' || hospital.TYPE_isSafetyNet === 'Y';
                    default:
                        return true;
                }
            });
        });
    }

    // Apply hospital type (Critical Access vs Acute Care)
    if (currentHospitalType) {
        filtered = filtered.filter(hospital => {
            if (currentHospitalType === 'Critical Access') {
                return hospital.TYPE_HospTyp_CAH === 1 || hospital.TYPE_HospTyp_CAH === '1' || hospital.TYPE_HospTyp_CAH === 'Y';
            } else if (currentHospitalType === 'Acute Care') {
                return hospital.TYPE_HospTyp_ACH === 1 || hospital.TYPE_HospTyp_ACH === '1' || hospital.TYPE_HospTyp_ACH === 'Y';
            }
            return true;
        });
    }

    // Apply metric category filters
    if (currentFilters.metrics.length > 0) {
        filtered = filtered.filter(hospital => {
            return currentFilters.metrics.some(metricCategory => {
                // This is a simplified implementation - you might want to expand this
                // based on your specific metric mapping
                switch(metricCategory) {
                    case 'Financial Transparency and Institutional Health':
                        return hospital.TIER_2_GRADE_Value && hospital.TIER_2_GRADE_Value !== 'N/A';
                    case 'Community Benefit Spending':
                        return hospital.TIER_3_GRADE_CB && hospital.TIER_3_GRADE_CB !== 'N/A';
                    case 'Healthcare Affordability and Billing':
                        return hospital.TIER_3_GRADE_Cost_Eff && hospital.TIER_3_GRADE_Cost_Eff !== 'N/A';
                    case 'Healthcare Access and Social Responsibility':
                        return hospital.TIER_3_GRADE_Inclusivity && hospital.TIER_3_GRADE_Inclusivity !== 'N/A';
                    default:
                        return true;
                }
            });
        });
    }

    // Apply location filter (simplified - you might want to add actual distance calculation)
    if (currentFilters.location) {
        filtered = filtered.filter(hospital => {
            // Simple ZIP code matching for demonstration
            // In a real implementation, you'd calculate distance using coordinates
            return hospital.Zip && hospital.Zip.toString().includes(currentFilters.location.zip);
        });
    }

    filteredHospitalData = filtered;
    
    // Apply current sort
    const sortValue = document.getElementById("sortSelect").value;
    sortAndRender(filteredHospitalData, sortValue);
}

// ===============================
// Reset Functionality
// ===============================
function resetAllFilters() {
    // Reset view mode to individuals
    setViewMode('individuals');
    
    // Reset hospital type
    currentHospitalType = null;
    document.getElementById("filterCriticalBtn").classList.remove("active");
    document.getElementById("filterAcuteBtn").classList.remove("active");

    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Reset location
    document.getElementById("zipInput").value = "";
    document.getElementById("radiusSelect").selectedIndex = 0;
    
    // Reset filters state
    currentFilters = {
        hospitalTypes: [],
        metrics: [],
        location: null
    };

    // Reset sort
    document.getElementById("sortSelect").selectedIndex = 0;

    console.log("All filters reset");
    
    // Show all hospitals
    filteredHospitalData = [...hospitalData];
    renderHospitals(filteredHospitalData);
    initHospitalMap(filteredHospitalData);
}

// ===============================
// Sort Functionality
// ===============================
function handleSortChange() {
    const sortValue = document.getElementById("sortSelect").value;
    sortAndRender(filteredHospitalData, sortValue);
}

function sortAndRender(data, sortValue) {
    let sorted = [...data];

    if (sortValue === "grade") {
        sorted.sort((a, b) => {
            const gradeA = a.TIER_1_GRADE_Lown_Composite || "F";
            const gradeB = b.TIER_1_GRADE_Lown_Composite || "F";
            // Custom grade order: A+ > A > A- > B+ > B > B- > C+ > C > C- > D+ > D > D- > F
            const gradeOrder = {
                'A+': 13, 'A': 12, 'A-': 11,
                'B+': 10, 'B': 9, 'B-': 8,
                'C+': 7, 'C': 6, 'C-': 5,
                'D+': 4, 'D': 3, 'D-': 2,
                'F': 1
            };
            return (gradeOrder[gradeB] || 0) - (gradeOrder[gradeA] || 0);
        });
    } else if (sortValue === "distance") {
        // For distance sorting, you'd need to implement actual distance calculation
        // This is a placeholder that sorts by ZIP code similarity
        if (currentFilters.location && currentFilters.location.zip) {
            sorted.sort((a, b) => {
                const aMatch = a.Zip && a.Zip.toString().includes(currentFilters.location.zip);
                const bMatch = b.Zip && b.Zip.toString().includes(currentFilters.location.zip);
                return bMatch - aMatch; // Exact matches first
            });
        }
    } else if (sortValue === "name") {
        sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
    } else if (sortValue === "size") {
        const sizeOrder = ["Extra Small", "Small", "Medium", "Large", "Extra Large"];
        sorted.sort((a, b) => {
            const sizeA = a.Size || "";
            const sizeB = b.Size || "";
            const indexA = sizeOrder.indexOf(sizeA) !== -1 ? sizeOrder.indexOf(sizeA) : 999;
            const indexB = sizeOrder.indexOf(sizeB) !== -1 ? sizeOrder.indexOf(sizeB) : 999;
            return indexA - indexB;
        });
    }

    renderHospitals(sorted);
    initHospitalMap(sorted);
}

// ===============================
// Download Functionality
// ===============================
function downloadData() {
    console.log("Download triggered for", filteredHospitalData.length, "hospitals");
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    const headers = ["Name", "City", "State", "Grade", "Size", "Type", "Address"];
    csvContent += headers.join(",") + "\n";
    
    // Data rows
    filteredHospitalData.forEach(hospital => {
        const row = [
            `"${hospital.Name || ''}"`,
            `"${hospital.City || ''}"`,
            `"${hospital.State || ''}"`,
            `"${hospital.TIER_1_GRADE_Lown_Composite || ''}"`,
            `"${hospital.Size || ''}"`,
            `"${getHospitalType(hospital)}"`,
            `"${hospital.Address || ''}"`
        ];
        csvContent += row.join(",") + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "georgia_hospitals_filtered.csv");
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
}

function getHospitalType(hospital) {
    const types = [];
    if (hospital.TYPE_HospTyp_CAH === 1 || hospital.TYPE_HospTyp_CAH === '1') types.push("Critical Access");
    if (hospital.TYPE_HospTyp_ACH === 1 || hospital.TYPE_HospTyp_ACH === '1') types.push("Acute Care");
    if (hospital.TYPE_NonProfit === 1 || hospital.TYPE_NonProfit === '1') types.push("Non-profit");
    if (hospital.TYPE_ForProfit === 1 || hospital.TYPE_ForProfit === '1') types.push("For Profit");
    return types.join(", ");
}

// ===============================
// Render Hospitals (Updated)
// ===============================
function renderHospitals(data) {
    const resultsTable = document.getElementById("hospitalResults");
    const resultsCount = document.getElementById("resultsCount");

    // Clear old results
    resultsTable.innerHTML = "";

    // Update results count
    resultsCount.textContent = `Viewing ${data.length} results`;

    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px;">No hospitals match the selected filters.</td></tr>`;
        return;
    }

    data.forEach(hospital => {
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
            <small>${getHospitalTypeDisplay(hospital)}</small>
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
                <p class="inline-stars"><strong>Outcome:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Outcome || "F").value)}</p>
                <p class="inline-stars"><strong>Value:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Value || "F").value)}</p>
                <p class="inline-stars"><strong>Civic:</strong> ${renderStars(convertGradeToStars(hospital.TIER_2_GRADE_Civic || "F").value)}</p>
                <p class="inline-stars"><strong>Safety:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Saf || "F").value)}</p>
                <p class="inline-stars"><strong>Experience:</strong> ${renderStars(convertGradeToStars(hospital.TIER_3_GRADE_Pat_Exp || "F").value)}</p>
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

function getHospitalTypeDisplay(hospital) {
    const types = [];
    if (hospital.TYPE_urban === 1 || hospital.TYPE_urban === '1') types.push("Urban");
    if (hospital.TYPE_rural === 1 || hospital.TYPE_rural === '1') types.push("Rural");
    if (hospital.TYPE_NonProfit === 1 || hospital.TYPE_NonProfit === '1') types.push("Non-profit");
    if (hospital.TYPE_ForProfit === 1 || hospital.TYPE_ForProfit === '1') types.push("For Profit");
    return types.join(" • ");
}

// ===============================
// Star Rating Utilities (Keep existing)
// ===============================
function convertGradeToStars(grade) {
    const gradeMap = {
        "A+": 5,
        "A": 5,
        "A-": 4.5,
        "B+": 4.5,
        "B": 4,
        "B-": 3.5,
        "C+": 3.5,
        "C": 3,
        "C-": 2.5,
        "D+": 2.5,
        "D": 2,
        "D-": 1.5,
        "F": 1,
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
// Map Integration (Keep existing)
// ===============================
let map;
let mapMarkers = [];

function getZipCoords(zip) {
    const baseLat = 31.0;
    const baseLon = -85.5;
    const zipNum = parseInt(String(zip).replace(/\D/g, "")) || 30000;
    const offsetLat = ((zipNum % 300) / 100) * 0.8;
    const offsetLon = ((zipNum % 700) / 100) * 0.8;
    return [baseLat + offsetLat, baseLon + offsetLon];
}

function initHospitalMap(data) {
    const mapDiv = document.getElementById("mainMap");
    if (!mapDiv) return;

    if (!map) {
        map = L.map("mainMap").setView([32.7, -83.4], 7);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);
    }

    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude) || parseFloat(hospital.LAT) || parseFloat(hospital.lat) || parseFloat(hospital.latitude);
        let lon = parseFloat(hospital.Longitude) || parseFloat(hospital.LON) || parseFloat(hospital.lon) || parseFloat(hospital.longitude);

        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }
        if (!lat || !lon) return;

        const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <strong>${hospital.HOSPITAL_NAME || hospital.Name}</strong><br>
            ${hospital.CITY || ""}, ${hospital.STATE || ""}<br>
            <div class="star-rating">${renderStars(stars.value)}</div>
            <a href="details.html?id=${hospital.RECORD_ID}" target="_blank" class="view-full-detail">
                View Full Details
            </a>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
    } else {
        map.setView([32.1656, -82.9001], 7);
    }
    
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}

// ===============================
// Error Popup Utility (Keep existing)
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
