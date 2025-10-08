// ===============================
// Data Storage
// ===============================
let hospitalData = [];
let filteredHospitalData = [];

// ===============================
// Sample Hospital Data
// ===============================
const sampleHospitalData = [
    {
        RECORD_ID: 1,
        Name: "Atlanta General Hospital",
        City: "Atlanta",
        State: "GA",
        Zip: "30303",
        TIER_1_GRADE_Lown_Composite: "A",
        TIER_2_GRADE_Outcome: "A",
        TIER_2_GRADE_Value: "B+",
        TIER_2_GRADE_Civic: "A-",
        TIER_3_GRADE_Pat_Saf: "A",
        TIER_3_GRADE_Pat_Exp: "B+",
        Size: "Large",
        TYPE_urban: true,
        TYPE_rural: false,
        TYPE_NonProfit: true,
        TYPE_ForProfit: false,
        TYPE_chrch_affl_f: false,
        TYPE_AMC: true,
        TYPE_isSafetyNet: true,
        TYPE_HospTyp_CAH: false,
        TYPE_HospTyp_ACH: true,
        HOSPITAL_SYSTEM: true,
        Latitude: 33.7490,
        Longitude: -84.3880
    },
    {
        RECORD_ID: 2,
        Name: "Savannah Community Hospital",
        City: "Savannah",
        State: "GA",
        Zip: "31401",
        TIER_1_GRADE_Lown_Composite: "B+",
        TIER_2_GRADE_Outcome: "B",
        TIER_2_GRADE_Value: "B+",
        TIER_2_GRADE_Civic: "A",
        TIER_3_GRADE_Pat_Saf: "B",
        TIER_3_GRADE_Pat_Exp: "A-",
        Size: "Medium",
        TYPE_urban: true,
        TYPE_rural: false,
        TYPE_NonProfit: true,
        TYPE_ForProfit: false,
        TYPE_chrch_affl_f: true,
        TYPE_AMC: false,
        TYPE_isSafetyNet: false,
        TYPE_HospTyp_CAH: false,
        TYPE_HospTyp_ACH: true,
        HOSPITAL_SYSTEM: false,
        Latitude: 32.0809,
        Longitude: -81.0912
    },
    {
        RECORD_ID: 3,
        Name: "Macon Regional Medical Center",
        City: "Macon",
        State: "GA",
        Zip: "31201",
        TIER_1_GRADE_Lown_Composite: "B",
        TIER_2_GRADE_Outcome: "B-",
        TIER_2_GRADE_Value: "B",
        TIER_2_GRADE_Civic: "B+",
        TIER_3_GRADE_Pat_Saf: "B",
        TIER_3_GRADE_Pat_Exp: "B",
        Size: "Medium",
        TYPE_urban: false,
        TYPE_rural: true,
        TYPE_NonProfit: false,
        TYPE_ForProfit: true,
        TYPE_chrch_affl_f: false,
        TYPE_AMC: false,
        TYPE_isSafetyNet: false,
        TYPE_HospTyp_CAH: true,
        TYPE_HospTyp_ACH: false,
        HOSPITAL_SYSTEM: true,
        Latitude: 32.8306,
        Longitude: -83.6513
    },
    {
        RECORD_ID: 4,
        Name: "Augusta Health Partners",
        City: "Augusta",
        State: "GA",
        Zip: "30901",
        TIER_1_GRADE_Lown_Composite: "A-",
        TIER_2_GRADE_Outcome: "A",
        TIER_2_GRADE_Value: "A-",
        TIER_2_GRADE_Civic: "B+",
        TIER_3_GRADE_Pat_Saf: "A",
        TIER_3_GRADE_Pat_Exp: "B+",
        Size: "Large",
        TYPE_urban: true,
        TYPE_rural: false,
        TYPE_NonProfit: true,
        TYPE_ForProfit: false,
        TYPE_chrch_affl_f: false,
        TYPE_AMC: true,
        TYPE_isSafetyNet: true,
        TYPE_HospTyp_CAH: false,
        TYPE_HospTyp_ACH: true,
        HOSPITAL_SYSTEM: true,
        Latitude: 33.4708,
        Longitude: -81.9749
    },
    {
        RECORD_ID: 5,
        Name: "Columbus Medical Center",
        City: "Columbus",
        State: "GA",
        Zip: "31901",
        TIER_1_GRADE_Lown_Composite: "C+",
        TIER_2_GRADE_Outcome: "C",
        TIER_2_GRADE_Value: "C+",
        TIER_2_GRADE_Civic: "B-",
        TIER_3_GRADE_Pat_Saf: "C",
        TIER_3_GRADE_Pat_Exp: "B",
        Size: "Small",
        TYPE_urban: false,
        TYPE_rural: true,
        TYPE_NonProfit: false,
        TYPE_ForProfit: true,
        TYPE_chrch_affl_f: false,
        TYPE_AMC: false,
        TYPE_isSafetyNet: false,
        TYPE_HospTyp_CAH: true,
        TYPE_HospTyp_ACH: false,
        HOSPITAL_SYSTEM: false,
        Latitude: 32.4640,
        Longitude: -84.9877
    },
    {
        RECORD_ID: 6,
        Name: "Athens Community Hospital",
        City: "Athens",
        State: "GA",
        Zip: "30601",
        TIER_1_GRADE_Lown_Composite: "B+",
        TIER_2_GRADE_Outcome: "B+",
        TIER_2_GRADE_Value: "B",
        TIER_2_GRADE_Civic: "A-",
        TIER_3_GRADE_Pat_Saf: "B+",
        TIER_3_GRADE_Pat_Exp: "A-",
        Size: "Medium",
        TYPE_urban: false,
        TYPE_rural: true,
        TYPE_NonProfit: true,
        TYPE_ForProfit: false,
        TYPE_chrch_affl_f: true,
        TYPE_AMC: false,
        TYPE_isSafetyNet: true,
        TYPE_HospTyp_CAH: false,
        TYPE_HospTyp_ACH: true,
        HOSPITAL_SYSTEM: false,
        Latitude: 33.9590,
        Longitude: -83.3767
    }
];

// ===============================
// Load JSON Data
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    hospitalData = sampleHospitalData;
    filteredHospitalData = [...hospitalData];
    console.log("Hospital data loaded:", hospitalData.length, "records");

    // Initial render
    renderHospitals(filteredHospitalData);
    initHospitalMap(filteredHospitalData);

    // Set up event listeners
    setupEventListeners();
});

// ===============================
// Setup Event Listeners
// ===============================
function setupEventListeners() {
    // View toggle buttons
    document.getElementById("viewSystemsBtn").addEventListener("click", function() {
        this.classList.add("active");
        document.getElementById("viewIndividualsBtn").classList.remove("active");
        document.getElementById("individualOptions").style.display = "none";
        applyFilters();
    });

    document.getElementById("viewIndividualsBtn").addEventListener("click", function() {
        this.classList.add("active");
        document.getElementById("viewSystemsBtn").classList.remove("active");
        document.getElementById("individualOptions").style.display = "block";
        applyFilters();
    });

    // Individual hospital type buttons
    document.getElementById("filterCriticalBtn").addEventListener("click", function() {
        const isActive = this.classList.contains("active");
        document.getElementById("filterCriticalBtn").classList.remove("active");
        document.getElementById("filterAcuteBtn").classList.remove("active");
        if (!isActive) {
            this.classList.add("active");
        }
        applyFilters();
    });

    document.getElementById("filterAcuteBtn").addEventListener("click", function() {
        const isActive = this.classList.contains("active");
        document.getElementById("filterCriticalBtn").classList.remove("active");
        document.getElementById("filterAcuteBtn").classList.remove("active");
        if (!isActive) {
            this.classList.add("active");
        }
        applyFilters();
    });

    // Sort functionality
    document.getElementById("sortSelect").addEventListener("change", function() {
        sortAndRender(filteredHospitalData);
    });

    // Filter buttons
    document.getElementById("applyFiltersBtn").addEventListener("click", applyFilters);
    document.getElementById("applyLocationBtn").addEventListener("click", applyFilters);

    // Reset button
    document.getElementById("resetFiltersBtn").addEventListener("click", resetFilters);

    // Download button
    document.getElementById("downloadDataBtn").addEventListener("click", function() {
        console.log("Download triggered");
        alert("Download functionality would be implemented here");
    });
}

// ===============================
// Render Hospitals
// ===============================
function renderHospitals(data) {
    const resultsTable = document.getElementById("hospitalResults");
    const resultsCount = document.getElementById("resultsCount");

    // Clear old results
    resultsTable.innerHTML = "";

    // Update results count
    resultsCount.textContent = `Viewing ${data.length} results`;

    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3">No hospitals match the selected filters.</td></tr>`;
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
            <a href="detail.html?id=${hospital.RECORD_ID}" class="hospital-link">
              ${hospital.Name || "Unnamed Hospital"}
            </a>
          </strong><br>
          ${hospital.City || ""}, ${hospital.State || ""}
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
                window.location.href = `detail.html?id=${hospital.RECORD_ID}`;
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

// ===============================
// Filtering Functionality
// ===============================
function applyFilters() {
    const zip = document.getElementById("zipInput").value.trim();
    const checkedTypes = [...document.querySelectorAll("input[type='checkbox']:checked")].map(cb => cb.value);
    
    let filtered = hospitalData.filter(hospital => {
        // Hospital type filtering
        let typeMatch = true;
        if (checkedTypes.length > 0) {
            typeMatch = checkedTypes.some(type => {
                const typeLower = type.toLowerCase();
                if (typeLower.includes("urban")) return hospital.TYPE_urban;
                if (typeLower.includes("rural")) return hospital.TYPE_rural;
                if (typeLower.includes("non-profit")) return hospital.TYPE_NonProfit;
                if (typeLower.includes("for profit")) return hospital.TYPE_ForProfit;
                if (typeLower.includes("church")) return hospital.TYPE_chrch_affl_f;
                if (typeLower.includes("academic")) return hospital.TYPE_AMC;
                if (typeLower.includes("safety")) return hospital.TYPE_isSafetyNet;
                return false;
            });
        }

        // Individual hospital type filtering
        const selectedType = getSelectedHospitalType();
        let individualTypeMatch = true;
        if (selectedType === "Critical Access") {
            individualTypeMatch = hospital.TYPE_HospTyp_CAH;
        } else if (selectedType === "Acute Care") {
            individualTypeMatch = hospital.TYPE_HospTyp_ACH;
        }

        return typeMatch && individualTypeMatch;
    });

    filteredHospitalData = filtered;
    sortAndRender(filteredHospitalData);
}

// Helper function to get current selection
function getSelectedHospitalType() {
    if (document.getElementById("filterCriticalBtn").classList.contains("active")) return "Critical Access";
    if (document.getElementById("filterAcuteBtn").classList.contains("active")) return "Acute Care";
    return null;
}

// ===============================
// Sorting Functionality
// ===============================
function sortAndRender(data) {
    const sortValue = document.getElementById("sortSelect").value;

    let sorted = [...data];

    if (sortValue === "grade") {
        sorted.sort((a, b) => {
            const gradeA = a.TIER_1_GRADE_Lown_Composite || "F";
            const gradeB = b.TIER_1_GRADE_Lown_Composite || "F";
            return gradeB.localeCompare(gradeA); // High to Low
        });
    } else if (sortValue === "distance") {
        // This would require ZIP code distance calculation
        sorted.sort((a, b) => {
            return (a.distance || 99999) - (b.distance || 99999);
        });
    } else if (sortValue === "name") {
        sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
    } else if (sortValue === "size") {
        const sizeOrder = ["Small", "Medium", "Large", "Extra Large"];
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
// Reset Filters
// ===============================
function resetFilters() {
    // Reset all checkboxes
    document.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
    
    // Reset ZIP input
    document.getElementById("zipInput").value = "";
    
    // Reset radius select
    document.getElementById("radiusSelect").selectedIndex = 0;
    
    // Reset view toggles
    document.getElementById("viewSystemsBtn").classList.remove("active");
    document.getElementById("viewIndividualsBtn").classList.remove("active");
    document.getElementById("individualOptions").style.display = "none";
    document.getElementById("filterCriticalBtn").classList.remove("active");
    document.getElementById("filterAcuteBtn").classList.remove("active");
    
    // Reset sort
    document.getElementById("sortSelect").selectedIndex = 0;
    
    console.log("Filters reset");
    filteredHospitalData = [...hospitalData];
    renderHospitals(filteredHospitalData);
    initHospitalMap(filteredHospitalData);
}

// ===============================
// Star Rating Utilities
// ===============================
function convertGradeToStars(grade) {
    const gradeMap = {
        "A+": 5, "A": 5, "A-": 4.5,
        "B+": 4.5, "B": 4, "B-": 3.5,
        "C+": 3.5, "C": 3, "C-": 2.5,
        "D+": 2.5, "D": 2, "D-": 1.5,
        "F": 1,
    };
    const value = gradeMap[grade?.trim()] || 0;
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
    return `<svg class="star full" viewBox="0 0 24 24" width="20" height="20">
        <path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

function halfStarSVG() {
    return `<svg class="star half" viewBox="0 0 24 24" width="20" height="20">
        <defs><linearGradient id="halfGradient" x1="0" x2="1">
        <stop offset="50%" stop-color="#f48810"/><stop offset="50%" stop-color="#a4cc95"/>
        </linearGradient></defs>
        <path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

function emptyStarSVG() {
    return `<svg class="star empty" viewBox="0 0 24 24" width="20" height="20">
        <path fill="#ddd" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

// ===============================
// Leaflet Map Integration
// ===============================
let map;
let mapMarkers = [];

function getZipCoords(zip) {
    const lookup = {
        "30303": [33.7525, -84.3915], "30720": [34.7698, -84.9719],
        "31201": [32.8306, -83.6513], "31901": [32.464, -84.9877],
        "31401": [32.0809, -81.0912], "31520": [31.1499, -81.4915],
        "31701": [31.5795, -84.1557], "39817": [30.9043, -84.5762],
        "30601": [33.959, -83.3767], "30161": [34.2546, -85.1647],
        "30901": [33.4708, -81.9749]
    };
    return lookup[String(zip)] || [32.5, -83.5];
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

    // Clear old markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude) || parseFloat(hospital.LAT) || parseFloat(hospital.lat);
        let lon = parseFloat(hospital.Longitude) || parseFloat(hospital.LON) || parseFloat(hospital.lon);

        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }
        if (!lat || !lon) return;

        const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
        const stars = convertGradeToStars(grade);

        const popupHTML = `
        <strong>${hospital.Name || "Unnamed Hospital"}</strong><br>
        ${hospital.City || ""}, ${hospital.State || ""}<br>
        <div class="star-rating">${renderStars(stars.value)}</div>
        <a href="detail.html?id=${hospital.RECORD_ID}" target="_blank" class="view-full-detail">
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
// Error Popup Utility
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
