// ===============================
// Hospital Details Page Logic
// ===============================

let currentHospital = null;
let detailMap = null;

// ===============================
// DOM Content Loaded
// ===============================

document.addEventListener("DOMContentLoaded", function() {
    console.log("Details page loaded");
    initializeDetailsPage();
});

// ===============================
// Initialize Details Page
// ===============================

async function initializeDetailsPage() {
    try {
        // Get hospital ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hospitalId = urlParams.get("id");
        
        if (!hospitalId) {
            throw new Error("No hospital ID provided in URL");
        }
        
        // Load hospital data
        await loadHospitalData();
        
        // Find the specific hospital
        currentHospital = hospitalData.find(h => h.RECORD_ID == hospitalId);
        
        if (!currentHospital) {
            throw new Error("Hospital not found");
        }
        
        // Populate the page with hospital data
        populateHospitalDetails();
        
        // Initialize the map
        initializeDetailMap();
        
    } catch (error) {
        console.error("Error initializing details page:", error);
        showError("Unable to load hospital details. Please try again.");
    }
}

// ===============================
// Load Hospital Data
// ===============================

let hospitalData = [];

async function loadHospitalData() {
    try {
        // Try to load from local JSON file
        const response = await fetch("../data/2025/2025_Lown_Index_GA.json");
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        hospitalData = data;
        
    } catch (error) {
        console.error("Error loading hospital data:", error);
        // Fallback to sample data
        hospitalData = getSampleData();
    }
}

function getSampleData() {
    return [
        {
            "RECORD_ID": "1",
            "Name": "Atlanta Medical Center",
            "Address": "303 Parkway Dr NE",
            "City": "Atlanta",
            "State": "GA",
            "Zip": "30312",
            "County": "Fulton",
            "Latitude": 33.7488,
            "Longitude": -84.3877,
            "TYPE_HospTyp_CAH": 0,
            "TYPE_HospTyp_ACH": 1,
            "TYPE_AMC": 1,
            "TYPE_NonProfit": 1,
            "TYPE_ForProfit": 0,
            "TYPE_urban": 1,
            "TYPE_rural": 0,
            "Size": "xl",
            "beds": 460,
            "SYSTEM_NAME": "Wellstar Health System",
            "TIER_1_GRADE_Lown_Composite": "B+",
            "TIER_2_GRADE_Value": "B",
            "TIER_3_GRADE_CB": "C+",
            "TIER_3_GRADE_Cost_Eff": "B",
            "TIER_3_GRADE_Inclusivity": "B-",
            "SERVICES": "Emergency, Surgery, Cardiology, Oncology"
        }
    ];
}

// ===============================
// Populate Hospital Details
// ===============================

function populateHospitalDetails() {
    if (!currentHospital) return;
    
    // Basic Information
    document.getElementById("hospitalName").textContent = currentHospital.Name || "Unknown Hospital";
    document.getElementById("streetLine").textContent = currentHospital.Address || "Address not available";
    document.getElementById("cityStateZip").textContent = `${currentHospital.City || ""}, ${currentHospital.State || ""} ${currentHospital.Zip || ""}`;
    document.getElementById("hospitalCounty").textContent = currentHospital.County || "---";
    document.getElementById("hospitalSize").textContent = getSizeCategory(currentHospital.Size);
    document.getElementById("hospitalType").textContent = getHospitalTypeDisplay(currentHospital);
    document.getElementById("hospitalCareLevel").textContent = getCareLevel(currentHospital);
    document.getElementById("hospitalSystem").textContent = currentHospital.SYSTEM_NAME || "Independent";
    document.getElementById("hospitalUrbanRural").textContent = getUrbanRuralDisplay(currentHospital);
    document.getElementById("hospitalBeds").textContent = currentHospital.beds ? currentHospital.beds.toLocaleString() : "---";
    
    // Overall Grade
    const overallGrade = currentHospital.TIER_1_GRADE_Lown_Composite || "N/A";
    document.getElementById("overallStars").innerHTML = generateStars(overallGrade);
    document.getElementById("overallGradeText").textContent = `Overall Grade: ${overallGrade}`;
    
    // Services
    const servicesList = document.getElementById("hospitalServices");
    const services = parseServices(currentHospital.SERVICES);
    servicesList.innerHTML = services.map(service => `<li>${service}</li>`).join("");
    
    // Metric Scores
    populateMetricScores();
    
    // Google Maps Link
    const gmapsLink = document.getElementById("gmapsLink");
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentHospital.Address + ', ' + currentHospital.City + ', ' + currentHospital.State + ' ' + currentHospital.Zip)}`;
    gmapsLink.href = mapsUrl;
    
    // Initialize the map after populating details
    initializeDetailMap();
}

// ===============================
// Map Functions
// ===============================

function initializeDetailMap() {
    console.log("Initializing detail map...");
    
    if (!currentHospital) {
        console.warn("No hospital data available for map");
        return;
    }

    // Get coordinates from hospital data
    let lat = parseFloat(currentHospital.Latitude);
    let lon = parseFloat(currentHospital.Longitude);

    // If no coordinates, use ZIP code approximation
    if ((!lat || !lon) && currentHospital.Zip) {
        console.log("Using ZIP code coordinates fallback");
        [lat, lon] = getZipCoords(currentHospital.Zip);
    }

    if (!lat || !lon) {
        console.error("Could not determine coordinates for hospital");
        document.getElementById("leafletMap").innerHTML = '<p>Location data not available</p>';
        return;
    }

    console.log("Map coordinates:", lat, lon);

    const mapDiv = document.getElementById("leafletMap");
    if (!mapDiv) {
        console.error("Map container not found!");
        return;
    }

    // Clear any existing map
    if (detailMap) {
        detailMap.remove();
    }

    // Initialize map
    detailMap = L.map("leafletMap").setView([lat, lon], 15);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18
    }).addTo(detailMap);

    // Add hospital marker
    L.marker([lat, lon])
        .addTo(detailMap)
        .bindPopup(`
            <div class="map-popup">
                <h3>${currentHospital.Name || "Unknown Hospital"}</h3>
                <p><strong>Address:</strong> ${currentHospital.Address || "Not available"}</p>
                <p>${currentHospital.City || ""}, ${currentHospital.State || ""} ${currentHospital.Zip || ""}</p>
                <p><strong>Grade:</strong> ${currentHospital.TIER_1_GRADE_Lown_Composite || "N/A"}</p>
            </div>
        `)
        .openPopup();

    console.log("Detail map initialized successfully");

    // Ensure map is properly sized
    setTimeout(() => {
        detailMap.invalidateSize();
    }, 100);
}

// ===============================
// Helper Functions
// ===============================

function getSizeCategory(size) {
    const sizeMap = {
        "xs": "Extra Small",
        "s": "Small", 
        "m": "Medium",
        "l": "Large",
        "xl": "Extra Large"
    };
    return sizeMap[size] || "Unknown Size";
}

function getHospitalTypeDisplay(hospital) {
    const types = [];
    if (hospital.TYPE_HospTyp_CAH === 1) types.push("Critical Access");
    if (hospital.TYPE_HospTyp_ACH === 1) types.push("Acute Care");
    if (hospital.TYPE_AMC === 1) types.push("Academic Medical Center");
    if (hospital.TYPE_NonProfit === 1) types.push("Non-profit");
    if (hospital.TYPE_ForProfit === 1) types.push("For Profit");
    if (hospital.TYPE_chrch_affl_f === 1) types.push("Church Affiliated");
    return types.length > 0 ? types.join(", ") : "General Hospital";
}

function getCareLevel(hospital) {
    if (hospital.TYPE_HospTyp_CAH === 1) return "Critical Access";
    if (hospital.TYPE_HospTyp_ACH === 1) return "Acute Care";
    if (hospital.TYPE_AMC === 1) return "Academic/Teaching";
    return "General Care";
}

function getUrbanRuralDisplay(hospital) {
    if (hospital.TYPE_urban === 1) return "Urban";
    if (hospital.TYPE_rural === 1) return "Rural";
    return "Unknown";
}

function parseServices(servicesData) {
    if (!servicesData) return ["General Care"];
    if (Array.isArray(servicesData)) return servicesData;
    if (typeof servicesData === "string") {
        return servicesData.split(",").map(s => s.trim()).filter(s => s);
    }
    return ["General Care"];
}

function getZipCoords(zip) {
    const lookup = {
        "30303": [33.7525, -84.3915], // Atlanta
        "30606": [33.9597, -83.3764], // Athens
        "31404": [32.0760, -81.0886], // Savannah
        "31533": [31.5185, -82.8499], // Douglas
        "30553": [34.3434, -83.8003]  // Lavonia
    };
    const coords = lookup[String(zip)] || [32.5, -83.5];
    return coords;
}

// ===============================
// Populate Metric Scores
// ===============================

function populateMetricScores() {
    if (!currentHospital) return;
    
    // Financial Transparency
    const financialGrade = currentHospital.TIER_2_GRADE_Value || "N/A";
    document.getElementById("financialTransparencyStars").innerHTML = generateStars(financialGrade);
    
    // Community Benefit
    const communityGrade = currentHospital.TIER_3_GRADE_CB || "N/A";
    document.getElementById("communityBenefitStars").innerHTML = generateStars(communityGrade);
    
    // Affordability & Billing
    const affordabilityGrade = currentHospital.TIER_3_GRADE_Cost_Eff || "N/A";
    document.getElementById("affordabilityBillingStars").innerHTML = generateStars(affordabilityGrade);
    
    // Access & Responsibility
    const accessGrade = currentHospital.TIER_3_GRADE_Inclusivity || "N/A";
    document.getElementById("accessResponsibilityStars").innerHTML = generateStars(accessGrade);
}

// ===============================
// Star Rating Utilities
// ===============================

function generateStars(grade) {
    const gradeToStars = {
        "A+": 5, "A": 5, "A-": 4.5,
        "B+": 4, "B": 3.5, "B-": 3,
        "C+": 2.5, "C": 2, "C-": 1.5,
        "D+": 1, "D": 0.5, "D-": 0.5,
        "F": 0, "N/A": 0
    };
    
    const starCount = gradeToStars[grade] || 0;
    let starsHTML = "";
    
    for (let i = 1; i <= 5; i++) {
        if (i <= starCount) {
            starsHTML += '<span class="star full">★</span>';
        } else if (i - 0.5 <= starCount) {
            starsHTML += '<span class="star half">★</span>';
        } else {
            starsHTML += '<span class="star">★</span>';
        }
    }
    
    return starsHTML;
}

// ===============================
// Error Handling
// ===============================

function showError(message) {
    const mainContent = document.querySelector("main");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <br>
        <a href="index.html" class="btn back">← Return to Search</a>
    `;
    
    mainContent.innerHTML = "";
    mainContent.appendChild(errorDiv);
}
