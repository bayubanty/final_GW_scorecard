// =======================================
// Georgia Watch Details Page Script - UPDATED
// Complete data mapping for all JSON fields
// =======================================

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get("id");
    
    if (!hospitalId) {
        console.warn("No ?id= parameter found in URL.");
        showError("No hospital selected. Please go back and select a hospital.");
        return;
    }

    try {
        // Show loading state
        showLoading();
        
        const res = await fetch("./data/2025/2025_GW_HospitalScores.json");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        
        // Match hospital by RECORD_ID
        const h = data.find(x => String(x.RECORD_ID) === String(hospitalId));
        
        if (!h) {
            throw new Error(`Hospital not found for ID: ${hospitalId}`);
        }

        // Populate all hospital data
        populateHospitalData(h);
        
        // Hide loading
        hideLoading();

    } catch (err) {
        console.error("Error loading hospital details:", err);
        hideLoading();
        showError("Failed to load hospital details. Please try again.");
    }
});

function populateHospitalData(hospital) {
    // ===== Hospital Name =====
    const hospitalName = hospital.Name || "Unnamed Hospital";
    document.getElementById("hospitalName").textContent = hospitalName;
    document.title = `${hospitalName} | Georgia Watch`;

    // ===== Address =====
    document.getElementById("streetLine").textContent = hospital.Address || "Address not available";
    document.getElementById("cityStateZip").textContent = 
        [hospital.City, hospital.State, hospital.Zip].filter(Boolean).join(", ") || "Location not available";

    // ===== Hospital Info Grid =====
    const infoMap = {
        hospitalCounty: hospital.County || "---",
        hospitalSize: getHospitalSize(hospital.Size),
        hospitalType: getHospitalType(hospital),
        hospitalCareLevel: getCareLevel(hospital),
        hospitalSystem: hospital.HOSPITAL_SYSTEM ? "Part of a Health System" : "Independent",
        hospitalUrbanRural: getUrbanRural(hospital),
        hospitalBeds: hospital.Beds || hospital.Bed_Count || hospital["Bed Count"] || "---"
    };

    // Apply info to page
    for (const [id, val] of Object.entries(infoMap)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // ===== Services =====
    const servicesList = document.getElementById("hospitalServices");
    servicesList.innerHTML = "";
    
    let services = getHospitalServices(hospital);
    servicesList.innerHTML = services.map(s => `<li>${s}</li>`).join("");

    // ===== Overall Grade =====
    const overallGrade = hospital["TIER_1_GRADE_Lown_Composite"] || hospital.Overall_Grade || "N/A";
    const starWrap = document.getElementById("overallStars");
    if (starWrap) {
        starWrap.innerHTML = renderStars(
            convertGradeToStars(overallGrade).value,
            overallGrade
        );
    }

    // Hide redundant text
    const gradeText = document.getElementById("overallGradeText");
    if (gradeText) gradeText.textContent = "";

    // ===== Category-level stars =====
    updateCategoryStars(hospital);

    // ===== Map =====
    initHospitalMap(hospital);
}

// ===== Helper Functions =====

function getHospitalSize(size) {
    const sizeMap = {
        'XS': 'Extra Small',
        'S': 'Small', 
        'M': 'Medium',
        'L': 'Large',
        'XL': 'Extra Large',
        'extra small': 'Extra Small',
        'small': 'Small',
        'medium': 'Medium',
        'large': 'Large',
        'extra large': 'Extra Large'
    };
    return sizeMap[String(size).toLowerCase()] || size || "---";
}

function getHospitalType(hospital) {
    const types = [];
    
    // Check all possible type indicators
    if (hospital.TYPE_HospTyp_CAH || hospital["Critical Access"]) types.push("Critical Access Hospital");
    if (hospital.TYPE_HospTyp_ACH || hospital["Acute Care"]) types.push("Acute Care Hospital");
    if (hospital.TYPE_AMC || hospital["Academic Medical Center"]) types.push("Academic Medical Center");
    if (hospital.TYPE_ForProfit || hospital["For Profit"]) types.push("For-Profit");
    if (hospital.TYPE_NonProfit || hospital.Nonprofit) types.push("Nonprofit");
    if (hospital.TYPE_chrch_affl_f || hospital["Faith Affiliated"]) types.push("Faith-Affiliated");
    if (hospital.TYPE_isSafetyNet || hospital["Safety Net"]) types.push("Safety Net Hospital");
    
    // Fallback: check if we can infer from other fields
    if (types.length === 0) {
        if (hospital.Type) types.push(hospital.Type);
    }
    
    return types.length ? types.join(", ") : "---";
}

function getCareLevel(hospital) {
    if (hospital.TYPE_HospTyp_CAH || hospital["Critical Access"]) return "Critical Access";
    if (hospital.TYPE_HospTyp_ACH || hospital["Acute Care"]) return "Acute Care";
    if (hospital.TYPE_AMC || hospital["Academic Medical Center"]) return "Academic / Teaching";
    return "---";
}

function getUrbanRural(hospital) {
    if (hospital.TYPE_urban || hospital.Urban) return "Urban";
    if (hospital.TYPE_rural || hospital.Rural) return "Rural";
    return "---";
}

function getHospitalServices(hospital) {
    let services = [];
    
    // Check multiple possible service fields
    if (hospital.Services && Array.isArray(hospital.Services)) {
        services = hospital.Services;
    } else if (hospital.Services && typeof hospital.Services === 'string') {
        services = hospital.Services.split(',').map(s => s.trim()).filter(s => s);
    } else if (hospital["Services Offered"]) {
        services = hospital["Services Offered"].split(',').map(s => s.trim()).filter(s => s);
    } else if (hospital["Hospital Services"]) {
        services = hospital["Hospital Services"].split(',').map(s => s.trim()).filter(s => s);
    }
    
    // Default services if none provided
    if (services.length === 0) {
        services = [
            "Emergency Care", "Cardiology", "Imaging & Radiology",
            "Pharmacy", "Physical Therapy", "Laboratory Services",
            "Primary Care", "Specialty Care"
        ];
    }
    
    return services;
}

function updateCategoryStars(hospital) {
    const categoryMap = {
        financialTransparencyStars: [
            "TIER_2_GRADE_Value",
            "TIER_3_GRADE_Exec_Comp",
            "Financial_Transparency_Grade",
            "Value_Grade"
        ],
        communityBenefitStars: [
            "TIER_3_GRADE_CB",
            "Community_Benefit_Grade",
            "Community_Benefit_Spending_Grade"
        ],
        affordabilityBillingStars: [
            "TIER_3_GRADE_Cost_Eff",
            "Affordability_Grade",
            "Billing_Grade"
        ],
        accessResponsibilityStars: [
            "TIER_3_GRADE_Inclusivity",
            "TIER_2_GRADE_Civic",
            "Access_Grade",
            "Social_Responsibility_Grade"
        ]
    };

    for (const [id, fields] of Object.entries(categoryMap)) {
        let grade = "N/A";
        for (const key of fields) {
            if (hospital[key] && hospital[key] !== "NULL" && hospital[key] !== "---" && hospital[key] !== "") {
                grade = hospital[key];
                break;
            }
        }
        const el = document.getElementById(id);
        if (el) el.innerHTML = renderStars(convertGradeToStars(grade).value, grade);
    }
}

function initHospitalMap(hospital) {
    const mapDiv = document.getElementById("leafletMap");
    if (!mapDiv) return;

    let lat = parseFloat(hospital.Latitude);
    let lon = parseFloat(hospital.Longitude);

    // Fallback to ZIP coordinates if no lat/lon
    if (!lat || !lon) {
        [lat, lon] = getZipCoords(hospital.Zip);
    }

    const map = L.map(mapDiv).setView([lat, lon], 13);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const marker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`
            <strong>${hospital.Name || 'Hospital'}</strong><br>
            ${hospital.Address || ''}<br>
            ${hospital.City || ''}, ${hospital.State || ''}
        `);

    // Update Google Maps link
    const gmapsLink = document.getElementById("gmapsLink");
    if (gmapsLink) {
        gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
}

// ===== ZIP Code Fallback Coordinates =====
function getZipCoords(zip) {
    const lookup = {
        '30303': [33.7525, -84.3915], // Atlanta
        '30308': [33.7712, -84.3810], // Atlanta
        '30309': [33.7940, -84.3870], // Atlanta
        '30606': [33.9597, -83.3764], // Athens
        '31404': [32.0760, -81.0886], // Savannah
        '31201': [32.8306, -83.6513], // Macon
        '31901': [32.464, -84.9877],  // Columbus
        '31701': [31.5795, -84.1557], // Albany
        '30501': [34.2963, -83.8255], // Gainesville
        '30161': [34.2546, -85.1647], // Rome
        '30720': [34.7698, -84.9719], // Dalton
        '31520': [31.1499, -81.4915], // Brunswick
        '39817': [30.9043, -84.5762], // Bainbridge
        '30809': [33.5515, -82.0903], // Evans/Augusta
        '31021': [32.5404, -82.9056]  // Dublin
    };
    return lookup[String(zip)] || [32.5, -83.5]; // Default to central GA
}

// ===== Star Rating Utilities =====
function convertGradeToStars(grade) {
    const gradeMap = {
        'A+': 5, 'A': 5, 'A-': 4.5,
        'B+': 4.5, 'B': 4, 'B-': 3.5,
        'C+': 3.5, 'C': 3, 'C-': 2.5,
        'D+': 2.5, 'D': 2, 'D-': 1.5,
        'F': 1, 'N/A': 0
    };
    const g = String(grade).trim().toUpperCase();
    return { value: gradeMap[g] || 0 };
}

function renderStars(value, grade = "") {
    let html = `<div class="star-rating" aria-label="${grade} (${value} of 5 stars)">`;
    for (let i = 1; i <= 5; i++) {
        if (value >= i) html += fullStarSVG();
        else if (value >= i - 0.5) html += halfStarSVG();
        else html += emptyStarSVG();
    }
    html += `</div>`;
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
            <stop offset="50%" stop-color="#f48810"/>
            <stop offset="50%" stop-color="#a4cc95"/>
        </linearGradient></defs>
        <path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

function emptyStarSVG() {
    return `<svg class="star empty" viewBox="0 0 24 24" width="20" height="20">
        <path fill="#ddd" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/>
    </svg>`;
}

// ===== UI Utilities =====
function showLoading() {
    // You can add a loading spinner here if needed
    console.log("Loading hospital details...");
}

function hideLoading() {
    console.log("Hospital details loaded");
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px; text-align: center;">
            <strong>Error:</strong> ${message}
            <br><br>
            <a href="index.html" class="btn" style="background: #6fb353; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">Back to Home</a>
        </div>
    `;
    document.querySelector('.metrics-wrap').prepend(errorDiv);
}
