// =======================================
// Georgia Watch Details Page Script 
// Robust data mapping for all hospital fields
// =======================================

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get("id");
    
    if (!hospitalId) {
        console.warn("No hospital ID parameter found in URL");
        showError("No hospital selected. Please go back and select a hospital.");
        return;
    }

    try {
        showLoading();
        console.log("Loading hospital details for ID:", hospitalId);
        
        const response = await fetch("./data/2025/2025_GW_HospitalScores.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log("Hospital data loaded:", data.length, "records");
        
        // Find hospital by ID with flexible matching
        const hospital = findHospitalById(data, hospitalId);
        
        if (!hospital) {
            throw new Error(`Hospital not found for ID: ${hospitalId}`);
        }

        console.log("Found hospital:", hospital);
        populateHospitalData(hospital);
        hideLoading();

    } catch (err) {
        console.error("Error loading hospital details:", err);
        hideLoading();
        showError(`Failed to load hospital details: ${err.message}`);
    }
});

// ===============================
// Flexible Data Access Utilities
// ===============================

function findHospitalById(data, hospitalId) {
    if (!data || !Array.isArray(data)) return null;
    
    // Try multiple ID field names
    const idFields = ['RECORD_ID', 'RecordID', 'record_id', 'ID', 'id', 'HospitalID', 'hospital_id'];
    
    for (const hospital of data) {
        for (const field of idFields) {
            if (hospital[field] && String(hospital[field]) === String(hospitalId)) {
                console.log(`Found hospital using field: ${field}`);
                return hospital;
            }
        }
    }
    
    console.log("Hospital not found with ID:", hospitalId);
    return null;
}

function getHospitalField(hospital, possibleFields, defaultValue = '---') {
    if (!hospital) return defaultValue;
    
    for (const field of possibleFields) {
        const value = hospital[field];
        if (value !== undefined && value !== null && value !== '' && value !== 'NULL') {
            return value;
        }
    }
    return defaultValue;
}

function getHospitalName(hospital) {
    return getHospitalField(hospital, [
        'Name', 'HospitalName', 'HOSPITAL_NAME', 'Hospital_Name', 
        'name', 'hospital_name', 'FacilityName', 'facility_name'
    ], 'Unnamed Hospital');
}

function getHospitalAddress(hospital) {
    return getHospitalField(hospital, [
        'Address', 'address', 'Street', 'street', 'Street_Address'
    ], 'Address not available');
}

function getHospitalCity(hospital) {
    return getHospitalField(hospital, ['City', 'city'], '');
}

function getHospitalState(hospital) {
    return getHospitalField(hospital, ['State', 'state', 'STATE'], '');
}

function getHospitalZip(hospital) {
    return getHospitalField(hospital, ['Zip', 'zip', 'ZIP', 'ZipCode', 'zip_code'], '');
}

function getHospitalGrade(hospital, gradeType = 'overall') {
    const gradeFields = {
        'overall': ['TIER_1_GRADE_Lown_Composite', 'Overall_Grade', 'Grade', 'grade', 'OverallGrade'],
        'outcome': ['TIER_2_GRADE_Outcome', 'Outcome_Grade', 'Outcome'],
        'value': ['TIER_2_GRADE_Value', 'Value_Grade', 'Value'],
        'civic': ['TIER_2_GRADE_Civic', 'Civic_Grade', 'Civic'],
        'safety': ['TIER_3_GRADE_Pat_Saf', 'Safety_Grade', 'Safety'],
        'experience': ['TIER_3_GRADE_Pat_Exp', 'Experience_Grade', 'Experience'],
        'cost': ['TIER_3_GRADE_Cost_Eff', 'Cost_Grade', 'Cost'],
        'executive': ['TIER_3_GRADE_Exec_Comp', 'Executive_Grade', 'Executive'],
        'community': ['TIER_3_GRADE_CB', 'Community_Grade', 'Community'],
        'inclusivity': ['TIER_3_GRADE_Inclusivity', 'Inclusivity_Grade', 'Inclusivity']
    };
    
    const fields = gradeFields[gradeType] || gradeFields['overall'];
    return getHospitalField(hospital, fields, 'N/A');
}

// ===============================
// Main Data Population
// ===============================

function populateHospitalData(hospital) {
    console.log("Populating hospital data:", hospital);
    
    // ===== Hospital Name =====
    const hospitalName = getHospitalName(hospital);
    document.getElementById("hospitalName").textContent = hospitalName;
    document.title = `${hospitalName} | Georgia Watch`;

    // ===== Address =====
    document.getElementById("streetLine").textContent = getHospitalAddress(hospital);
    
    const city = getHospitalCity(hospital);
    const state = getHospitalState(hospital);
    const zip = getHospitalZip(hospital);
    document.getElementById("cityStateZip").textContent = [city, state, zip].filter(Boolean).join(", ") || "Location not available";

    // ===== Hospital Info Grid =====
    populateHospitalInfo(hospital);

    // ===== Services =====
    populateHospitalServices(hospital);

    // ===== Overall Grade =====
    const overallGrade = getHospitalGrade(hospital, 'overall');
    const starWrap = document.getElementById("overallStars");
    if (starWrap) {
        starWrap.innerHTML = renderStars(convertGradeToStars(overallGrade).value, overallGrade);
    }

    // Hide redundant text
    const gradeText = document.getElementById("overallGradeText");
    if (gradeText) gradeText.textContent = "";

    // ===== Category-level stars =====
    updateCategoryStars(hospital);

    // ===== Map =====
    initHospitalMap(hospital);
}

function populateHospitalInfo(hospital) {
    const infoMap = {
        hospitalCounty: getHospitalField(hospital, ['County', 'county']),
        hospitalSize: getHospitalSize(hospital),
        hospitalType: getHospitalType(hospital),
        hospitalCareLevel: getCareLevel(hospital),
        hospitalSystem: getHospitalSystem(hospital),
        hospitalUrbanRural: getUrbanRural(hospital),
        hospitalBeds: getHospitalField(hospital, ['Beds', 'Bed_Count', 'Beds_Count', 'beds'])
    };

    // Apply info to page
    for (const [id, val] of Object.entries(infoMap)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
}

function populateHospitalServices(hospital) {
    const servicesList = document.getElementById("hospitalServices");
    if (!servicesList) return;
    
    servicesList.innerHTML = "";
    
    let services = [];
    
    // Check for services in multiple possible fields
    const servicesData = getHospitalField(hospital, [
        'Services', 'services', 'Services_Offered', 'services_offered',
        'Hospital_Services', 'hospital_services'
    ], null);
    
    if (servicesData) {
        if (Array.isArray(servicesData)) {
            services = servicesData;
        } else if (typeof servicesData === 'string') {
            services = servicesData.split(',').map(s => s.trim()).filter(s => s);
        }
    }
    
    // Default services if none provided
    if (services.length === 0) {
        services = [
            "Emergency Care", "Cardiology", "Imaging & Radiology",
            "Pharmacy", "Physical Therapy", "Laboratory Services",
            "Primary Care", "Specialty Care", "Surgery"
        ];
    }
    
    servicesList.innerHTML = services.map(s => `<li>${s}</li>`).join("");
}

function updateCategoryStars(hospital) {
    const categoryMap = {
        financialTransparencyStars: ['value', 'executive'],
        communityBenefitStars: ['community'],
        affordabilityBillingStars: ['cost'],
        accessResponsibilityStars: ['inclusivity', 'civic']
    };

    for (const [elementId, gradeTypes] of Object.entries(categoryMap)) {
        let bestGrade = 'N/A';
        
        // Find the best available grade for this category
        for (const gradeType of gradeTypes) {
            const grade = getHospitalGrade(hospital, gradeType);
            if (grade !== 'N/A' && grade !== '---') {
                bestGrade = grade;
                break;
            }
        }
        
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = renderStars(convertGradeToStars(bestGrade).value, bestGrade);
        }
    }
}

// ===============================
// Hospital Attribute Helpers
// ===============================

function getHospitalSize(hospital) {
    const size = getHospitalField(hospital, ['Size', 'size', 'Hospital_Size']);
    const sizeMap = {
        'xs': 'Extra Small', 's': 'Small', 'm': 'Medium', 'l': 'Large', 'xl': 'Extra Large',
        'extra small': 'Extra Small', 'small': 'Small', 'medium': 'Medium', 'large': 'Large', 'extra large': 'Extra Large'
    };
    return sizeMap[String(size).toLowerCase()] || size || "---";
}

function getHospitalType(hospital) {
    const types = [];
    
    // Check all possible type indicators
    if (getHospitalField(hospital, ['TYPE_HospTyp_CAH', 'Critical_Access', 'critical_access'])) types.push("Critical Access Hospital");
    if (getHospitalField(hospital, ['TYPE_HospTyp_ACH', 'Acute_Care', 'acute_care'])) types.push("Acute Care Hospital");
    if (getHospitalField(hospital, ['TYPE_AMC', 'Academic_Medical_Center', 'academic'])) types.push("Academic Medical Center");
    if (getHospitalField(hospital, ['TYPE_ForProfit', 'For_Profit', 'for_profit'])) types.push("For-Profit");
    if (getHospitalField(hospital, ['TYPE_NonProfit', 'Nonprofit', 'nonprofit'])) types.push("Nonprofit");
    if (getHospitalField(hospital, ['TYPE_chrch_affl_f', 'Church_Affiliated', 'faith_affiliated'])) types.push("Faith-Affiliated");
    if (getHospitalField(hospital, ['TYPE_isSafetyNet', 'Safety_Net', 'safety_net'])) types.push("Safety Net Hospital");
    
    // Fallback: check if we can infer from other fields
    if (types.length === 0) {
        const typeField = getHospitalField(hospital, ['Type', 'type', 'Hospital_Type']);
        if (typeField && typeField !== '---') types.push(typeField);
    }
    
    return types.length ? types.join(", ") : "---";
}

function getCareLevel(hospital) {
    if (getHospitalField(hospital, ['TYPE_HospTyp_CAH', 'Critical_Access'])) return "Critical Access";
    if (getHospitalField(hospital, ['TYPE_HospTyp_ACH', 'Acute_Care'])) return "Acute Care";
    if (getHospitalField(hospital, ['TYPE_AMC', 'Academic_Medical_Center'])) return "Academic / Teaching";
    return "---";
}

function getHospitalSystem(hospital) {
    const systemFlag = getHospitalField(hospital, ['HOSPITAL_SYSTEM', 'Hospital_System', 'Part_of_System']);
    return systemFlag && systemFlag !== '0' && systemFlag !== 'false' ? "Part of a Health System" : "Independent";
}

function getUrbanRural(hospital) {
    if (getHospitalField(hospital, ['TYPE_urban', 'Urban', 'urban'])) return "Urban";
    if (getHospitalField(hospital, ['TYPE_rural', 'Rural', 'rural'])) return "Rural";
    return "---";
}

// ===============================
// Map Functions
// ===============================

function initHospitalMap(hospital) {
    const mapDiv = document.getElementById("leafletMap");
    if (!mapDiv) {
        console.error("Map container not found");
        return;
    }

    let lat = parseFloat(getHospitalField(hospital, ['Latitude', 'latitude', 'lat']));
    let lon = parseFloat(getHospitalField(hospital, ['Longitude', 'longitude', 'lon', 'lng']));

    // Fallback to ZIP coordinates if no lat/lon
    if (!lat || !lon) {
        const zip = getHospitalZip(hospital);
        [lat, lon] = getZipCoords(zip);
        console.log("Using ZIP coordinates for map:", lat, lon);
    }

    try {
        const map = L.map(mapDiv).setView([lat, lon], 13);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        const hospitalName = getHospitalName(hospital);
        const address = getHospitalAddress(hospital);
        const cityStateZip = [getHospitalCity(hospital), getHospitalState(hospital), getHospitalZip(hospital)].filter(Boolean).join(", ");

        L.marker([lat, lon])
            .addTo(map)
            .bindPopup(`
                <strong>${hospitalName}</strong><br>
                ${address}<br>
                ${cityStateZip}
            `)
            .openPopup();

        // Update Google Maps link
        const gmapsLink = document.getElementById("gmapsLink");
        if (gmapsLink) {
            gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
            gmapsLink.textContent = "Open in Google Maps";
        }

    } catch (error) {
        console.error("Error initializing map:", error);
    }
}

// ===============================
// ZIP Code Fallback Coordinates
// ===============================

function getZipCoords(zip) {
    const lookup = {
        '30303': [33.7525, -84.3915], '30308': [33.7712, -84.3810],
        '30309': [33.7940, -84.3870], '30606': [33.9597, -83.3764],
        '31404': [32.0760, -81.0886], '31201': [32.8306, -83.6513],
        '31901': [32.464, -84.9877], '31701': [31.5795, -84.1557],
        '30501': [34.2963, -83.8255], '30161': [34.2546, -85.1647],
        '30720': [34.7698, -84.9719], '31520': [31.1499, -81.4915],
        '39817': [30.9043, -84.5762], '30809': [33.5515, -82.0903],
        '31021': [32.5404, -82.9056], '31533': [31.5185, -82.8499]
    };
    return lookup[String(zip)] || [32.5, -83.5];
}

// ===============================
// Star Rating Utilities
// ===============================

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

// ===============================
// UI Utilities
// ===============================

function showLoading() {
    console.log("Loading hospital details...");
    // You could add a loading spinner here
}

function hideLoading() {
    console.log("Hospital details loaded");
    // You could remove loading spinner here
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px; text-align: center; border: 1px solid #f5c6cb;">
            <strong style="font-size: 1.1em;">Error Loading Hospital Details</strong>
            <p style="margin: 10px 0;">${message}</p>
            <a href="index.html" class="btn" style="background: #6fb353; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 10px;">
                ← Back to Hospital List
            </a>
        </div>
    `;
    
    const metricsWrap = document.querySelector('.metrics-wrap');
    if (metricsWrap) {
        metricsWrap.prepend(errorDiv);
    } else {
        document.body.prepend(errorDiv);
    }
}

// ===============================
// Mobile Navigation
// ===============================

function initMobileNavigation() {
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    
    if (mobileNavToggle && mobileNavOverlay) {
        mobileNavToggle.addEventListener('click', toggleMobileNavigation);
        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', toggleMobileNavigation);
        }
        mobileNavOverlay.addEventListener('click', function(e) {
            if (e.target === this) toggleMobileNavigation();
        });
    }
}

function toggleMobileNavigation() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const panel = document.querySelector('.mobile-nav-panel');
    
    if (!overlay || !panel) return;
    
    body.classList.toggle('mobile-nav-open');
    overlay.style.display = body.classList.contains('mobile-nav-open') ? 'block' : 'none';
    
    setTimeout(() => {
        panel.classList.toggle('active');
    }, 10);
}

// Initialize mobile navigation when page loads
document.addEventListener('DOMContentLoaded', function() {
    initMobileNavigation();
});
