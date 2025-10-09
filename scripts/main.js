// ===============================
// Data Storage and State
// ===============================
let hospitalData = [];
let filteredHospitalData = [];
let currentView = 'individuals';
let currentHospitalType = null;
let currentFilters = {
    hospitalTypes: [],
    metrics: [],
    location: null
};

// ===============================
// Sample Data
// ===============================
const sampleHospitalData = [
    {
        RECORD_ID: 1,
        Name: "Atlanta Medical Center",
        City: "Atlanta",
        State: "GA",
        Zip: "30303",
        Address: "123 Medical Drive",
        TIER_1_GRADE_Lown_Composite: "A",
        TIER_2_GRADE_Outcome: "A-",
        TIER_2_GRADE_Value: "B+",
        TIER_2_GRADE_Civic: "A",
        TIER_3_GRADE_Pat_Saf: "B",
        TIER_3_GRADE_Pat_Exp: "A-",
        TYPE_urban: 1,
        TYPE_rural: 0,
        TYPE_NonProfit: 1,
        TYPE_ForProfit: 0,
        TYPE_chrch_affl_f: 0,
        TYPE_AMC: 1,
        TYPE_isSafetyNet: 1,
        TYPE_HospTyp_CAH: 0,
        TYPE_HospTyp_ACH: 1,
        Size: "Large",
        Latitude: 33.7490,
        Longitude: -84.3880
    },
    {
        RECORD_ID: 2,
        Name: "Rural Health Clinic",
        City: "Macon",
        State: "GA",
        Zip: "31201",
        Address: "456 Country Road",
        TIER_1_GRADE_Lown_Composite: "B+",
        TIER_2_GRADE_Outcome: "B",
        TIER_2_GRADE_Value: "A-",
        TIER_2_GRADE_Civic: "B+",
        TIER_3_GRADE_Pat_Saf: "A",
        TIER_3_GRADE_Pat_Exp: "B",
        TYPE_urban: 0,
        TYPE_rural: 1,
        TYPE_NonProfit: 0,
        TYPE_ForProfit: 1,
        TYPE_chrch_affl_f: 1,
        TYPE_AMC: 0,
        TYPE_isSafetyNet: 0,
        TYPE_HospTyp_CAH: 1,
        TYPE_HospTyp_ACH: 0,
        Size: "Small",
        Latitude: 32.8306,
        Longitude: -83.6513
    },
    {
        RECORD_ID: 3,
        Name: "Savannah Community Hospital",
        City: "Savannah",
        State: "GA",
        Zip: "31401",
        Address: "789 Coastal Highway",
        TIER_1_GRADE_Lown_Composite: "A-",
        TIER_2_GRADE_Outcome: "A",
        TIER_2_GRADE_Value: "B",
        TIER_2_GRADE_Civic: "A-",
        TIER_3_GRADE_Pat_Saf: "B+",
        TIER_3_GRADE_Pat_Exp: "A",
        TYPE_urban: 1,
        TYPE_rural: 0,
        TYPE_NonProfit: 1,
        TYPE_ForProfit: 0,
        TYPE_chrch_affl_f: 0,
        TYPE_AMC: 0,
        TYPE_isSafetyNet: 1,
        TYPE_HospTyp_CAH: 0,
        TYPE_HospTyp_ACH: 1,
        Size: "Medium",
        Latitude: 32.0809,
        Longitude: -81.0912
    },
    {
        RECORD_ID: 4,
        Name: "Augusta Medical Center",
        City: "Augusta",
        State: "GA",
        Zip: "30901",
        Address: "321 River Street",
        TIER_1_GRADE_Lown_Composite: "C+",
        TIER_2_GRADE_Outcome: "C",
        TIER_2_GRADE_Value: "B-",
        TIER_2_GRADE_Civic: "C+",
        TIER_3_GRADE_Pat_Saf: "B",
        TIER_3_GRADE_Pat_Exp: "C",
        TYPE_urban: 1,
        TYPE_rural: 0,
        TYPE_NonProfit: 0,
        TYPE_ForProfit: 1,
        TYPE_chrch_affl_f: 0,
        TYPE_AMC: 1,
        TYPE_isSafetyNet: 0,
        TYPE_HospTyp_CAH: 0,
        TYPE_HospTyp_ACH: 1,
        Size: "Extra Large",
        Latitude: 33.4709,
        Longitude: -81.9748
    },
    {
        RECORD_ID: 5,
        Name: "Mountain View Hospital",
        City: "Blue Ridge",
        State: "GA",
        Zip: "30513",
        Address: "654 Highland Avenue",
        TIER_1_GRADE_Lown_Composite: "B",
        TIER_2_GRADE_Outcome: "B-",
        TIER_2_GRADE_Value: "B+",
        TIER_2_GRADE_Civic: "A-",
        TIER_3_GRADE_Pat_Saf: "A",
        TIER_3_GRADE_Pat_Exp: "B-",
        TYPE_urban: 0,
        TYPE_rural: 1,
        TYPE_NonProfit: 1,
        TYPE_ForProfit: 0,
        TYPE_chrch_affl_f: 1,
        TYPE_AMC: 0,
        TYPE_isSafetyNet: 1,
        TYPE_HospTyp_CAH: 1,
        TYPE_HospTyp_ACH: 0,
        Size: "Extra Small",
        Latitude: 34.8684,
        Longitude: -84.3241
    }
];

// ===============================
// Initialize Application
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    hospitalData = sampleHospitalData;
    filteredHospitalData = [...hospitalData];
    console.log("Hospital data loaded:", hospitalData.length, "records");

    renderHospitals(filteredHospitalData);
    initHospitalMap(filteredHospitalData);
    setupEventListeners();
});

// ===============================
// Event Listeners Setup
// ===============================
function setupEventListeners() {
    document.getElementById("viewSystemsBtn").addEventListener("click", () => {
        setViewMode('systems');
    });

    document.getElementById("viewIndividualsBtn").addEventListener("click", () => {
        setViewMode('individuals');
    });

    document.getElementById("filterCriticalBtn").addEventListener("click", () => {
        toggleHospitalType('Critical Access');
    });

    document.getElementById("filterAcuteBtn").addEventListener("click", () => {
        toggleHospitalType('Acute Care');
    });

    document.getElementById("applyLocationBtn").addEventListener("click", applyLocationFilter);

    const hospitalTypeCheckboxes = document.querySelectorAll('input[value="Urban"], input[value="Rural"], input[value="Non-profit"], input[value="For Profit"], input[value="Church Affiliated"], input[value="Academic Medical Center"], input[value="Safety Net"]');
    hospitalTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateHospitalTypeFilters);
    });

    const metricCheckboxes = document.querySelectorAll('input[value="Financial Transparency and Institutional Health"], input[value="Community Benefit Spending"], input[value="Healthcare Affordability and Billing"], input[value="Healthcare Access and Social Responsibility"]');
    metricCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateMetricFilters);
    });

    document.getElementById("applyFiltersBtn").addEventListener("click", applyAllFilters);
    document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);
    document.getElementById("downloadDataBtn").addEventListener("click", downloadData);

    document.getElementById("sortSelect").addEventListener("change", handleSortChange);
}

// ===============================
// View Mode Management
// ===============================
function setViewMode(mode) {
    currentView = mode;
    
    const systemsBtn = document.getElementById("viewSystemsBtn");
    const individualsBtn = document.getElementById("viewIndividualsBtn");

    if (mode === 'systems') {
        systemsBtn.classList.add("active");
        individualsBtn.classList.remove("active");
        console.log("View set to: Hospital Systems");
        showErrorPopup("Hospital Systems view is not yet implemented");
    } else {
        systemsBtn.classList.remove("active");
        individualsBtn.classList.add("active");
        console.log("View set to: Individual Hospitals");
    }

    applyAllFilters();
}

function toggleHospitalType(type) {
    const criticalBtn = document.getElementById("filterCriticalBtn");
    const acuteBtn = document.getElementById("filterAcuteBtn");

    if (currentHospitalType === type) {
        currentHospitalType = null;
        criticalBtn.classList.remove("active");
        acuteBtn.classList.remove("active");
    } else {
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

    if (currentFilters.hospitalTypes.length > 0) {
        filtered = filtered.filter(hospital => {
            return currentFilters.hospitalTypes.some(filterType => {
                switch(filterType) {
                    case 'Urban':
                        return hospital.TYPE_urban === 1;
                    case 'Rural':
                        return hospital.TYPE_rural === 1;
                    case 'Non-profit':
                        return hospital.TYPE_NonProfit === 1;
                    case 'For Profit':
                        return hospital.TYPE_ForProfit === 1;
                    case 'Church Affiliated':
                        return hospital.TYPE_chrch_affl_f === 1;
                    case 'Academic Medical Center':
                        return hospital.TYPE_AMC === 1;
                    case 'Safety Net':
                        return hospital.TYPE_isSafetyNet === 1;
                    default:
                        return true;
                }
            });
        });
    }

    if (currentHospitalType) {
        filtered = filtered.filter(hospital => {
            if (currentHospitalType === 'Critical Access') {
                return hospital.TYPE_HospTyp_CAH === 1;
            } else if (currentHospitalType === 'Acute Care') {
                return hospital.TYPE_HospTyp_ACH === 1;
            }
            return true;
        });
    }

    if (currentFilters.metrics.length > 0) {
        filtered = filtered.filter(hospital => {
            return currentFilters.metrics.some(metricCategory => {
                switch(metricCategory) {
                    case 'Financial Transparency and Institutional Health':
                        return hospital.TIER_2_GRADE_Value && hospital.TIER_2_GRADE_Value !== 'N/A';
                    case 'Community Benefit Spending':
                        return hospital.TIER_2_GRADE_Civic && hospital.TIER_2_GRADE_Civic !== 'N/A';
                    case 'Healthcare Affordability and Billing':
                        return hospital.TIER_3_GRADE_Pat_Exp && hospital.TIER_3_GRADE_Pat_Exp !== 'N/A';
                    case 'Healthcare Access and Social Responsibility':
                        return hospital.TIER_3_GRADE_Pat_Saf && hospital.TIER_3_GRADE_Pat_Saf !== 'N/A';
                    default:
                        return true;
                }
            });
        });
    }

    if (currentFilters.location) {
        filtered = filtered.filter(hospital => {
            return hospital.Zip && hospital.Zip.toString().includes(currentFilters.location.zip);
        });
    }

    filteredHospitalData = filtered;
    
    const sortValue = document.getElementById("sortSelect").value;
    sortAndRender(filteredHospitalData, sortValue);
}

// ===============================
// Reset Functionality
// ===============================
function resetAllFilters() {
    setViewMode('individuals');
    
    currentHospitalType = null;
    document.getElementById("filterCriticalBtn").classList.remove("active");
    document.getElementById("filterAcuteBtn").classList.remove("active");

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    document.getElementById("zipInput").value = "";
    document.getElementById("radiusSelect").selectedIndex = 0;
    
    currentFilters = {
        hospitalTypes: [],
        metrics: [],
        location: null
    };

    document.getElementById("sortSelect").selectedIndex = 0;

    console.log("All filters reset");
    
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
        if (currentFilters.location && currentFilters.location.zip) {
            sorted.sort((a, b) => {
                const aMatch = a.Zip && a.Zip.toString().includes(currentFilters.location.zip);
                const bMatch = b.Zip && b.Zip.toString().includes(currentFilters.location.zip);
                return bMatch - aMatch;
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
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const headers = ["Name", "City", "State", "Grade", "Size", "Type", "Address"];
    csvContent += headers.join(",") + "\n";
    
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
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "georgia_hospitals_filtered.csv");
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    showErrorPopup("Data downloaded successfully!");
}

function getHospitalType(hospital) {
    const types = [];
    if (hospital.TYPE_HospTyp_CAH === 1) types.push("Critical Access");
    if (hospital.TYPE_HospTyp_ACH === 1) types.push("Acute Care");
    if (hospital.TYPE_NonProfit === 1) types.push("Non-profit");
    if (hospital.TYPE_ForProfit === 1) types.push("For Profit");
    return types.join(", ");
}

// ===============================
// Render Hospitals
// ===============================
function renderHospitals(data) {
    const resultsTable = document.getElementById("hospitalResults");
    const resultsCount = document.getElementById("resultsCount");

    resultsTable.innerHTML = "";
    resultsCount.textContent = `Viewing ${data.length} results`;

    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px;">No hospitals match the selected filters.</td></tr>`;
        return;
    }

    data.forEach(hospital => {
        const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
        const stars = convertGradeToStars(grade);

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

        const buttonCell = document.createElement("td");
        buttonCell.classList.add("details-buttons");

        const detailsButton = document.createElement("button");
        detailsButton.textContent = "View Details ▼";
        detailsButton.classList.add("toggle-detail");

        const fullDetailsButton = document.createElement("button");
        fullDetailsButton.textContent = "View Full Details";
        fullDetailsButton.classList.add("view-full-detail");
        fullDetailsButton.addEventListener("click", () => {
            showErrorPopup("Full details page would open here for " + hospital.Name);
        });

        buttonCell.appendChild(detailsButton);
        buttonCell.appendChild(fullDetailsButton);
        row.appendChild(buttonCell);

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

        detailsButton.addEventListener("click", () => {
            const isHidden = detailRow.style.display === "none" || detailRow.style.display === "";
            detailRow.style.display = isHidden ? "table-row" : "none";
            detailsButton.textContent = isHidden ? "Hide Details ▲" : "View Details ▼";
        });

        resultsTable.appendChild(row);
        resultsTable.appendChild(detailRow);
    });
}

function getHospitalTypeDisplay(hospital) {
    const types = [];
    if (hospital.TYPE_urban === 1) types.push("Urban");
    if (hospital.TYPE_rural === 1) types.push("Rural");
    if (hospital.TYPE_NonProfit === 1) types.push("Non-profit");
    if (hospital.TYPE_ForProfit === 1) types.push("For Profit");
    return types.join(" • ");
}

// ===============================
// Star Rating Utilities
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
// Map Integration
// ===============================
let map;
let mapMarkers = [];

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
        let lat = hospital.Latitude || 32.7;
        let lon = hospital.Longitude || -83.4;

        const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <strong>${hospital.Name}</strong><br>
            ${hospital.City}, ${hospital.State}<br>
            <div class="star-rating">${renderStars(stars.value)}</div>
            <button onclick="showErrorPopup('Details for ${hospital.Name}')" class="view-full-detail">
                View Details
            </button>
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
    popup.innerHTML = `<p>${message}</p
