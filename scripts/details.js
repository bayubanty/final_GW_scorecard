// =======================================
//  Georgia Watch Details Page Script
// =======================================

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const hospitalId = params.get("id");
    
    // Sample hospital data for demonstration
    const hospitalData = [
        {
            RECORD_ID: 1,
            Name: "Atlanta General Hospital",
            Address: "123 Medical Center Drive",
            City: "Atlanta",
            State: "GA",
            Zip: "30303",
            County: "Fulton",
            Size: "Large",
            TYPE_HospTyp_ACH: true,
            TYPE_HospTyp_CAH: false,
            TYPE_AMC: true,
            TYPE_ForProfit: false,
            TYPE_NonProfit: true,
            TYPE_chrch_affl_f: false,
            TYPE_isSafetyNet: true,
            HOSPITAL_SYSTEM: true,
            TYPE_urban: true,
            TYPE_rural: false,
            Latitude: 33.7490,
            Longitude: -84.3880,
            "TIER_1_GRADE_Lown_Composite": "A",
            "TIER_2_GRADE_Value": "A",
            "TIER_3_GRADE_CB": "B+",
            "TIER_3_GRADE_Cost_Eff": "A-",
            "TIER_3_GRADE_Inclusivity": "B"
        }
    ];

    if (!hospitalId) {
        console.warn("No ?id= parameter found in URL.");
        return;
    }

    try {
        // Find hospital by ID
        const hospital = hospitalData.find(h => String(h.RECORD_ID) === String(hospitalId));

        if (!hospital) {
            console.error("Hospital not found for ID:", hospitalId);
            return;
        }

        // ===== Helper functions =====
        const safe = val =>
            val && val !== "NULL" && val !== "—" ? val : "—";

        const isTrue = val =>
            val === 1 || val === "1" || val === "Y" || val === "Yes" || val === "TRUE";

        // ===== Hospital Name =====
        const hospitalName = hospital.Name || "Unnamed Hospital";
        const nameEl = document.getElementById("hospitalName");
        if (nameEl) nameEl.textContent = hospitalName;

        // ===== Address =====
        const streetEl = document.getElementById("streetLine");
        if (streetEl) streetEl.textContent = hospital.Address || "—";

        const cityStateZipEl = document.getElementById("cityStateZip");
        if (cityStateZipEl)
            cityStateZipEl.textContent = [hospital.City, hospital.State, hospital.Zip].filter(Boolean).join(", ");

        // ===== Hospital Info =====
        const infoMap = {
            hospitalCounty: hospital.County || "—",
            hospitalSize: hospital.Size || "—",
            hospitalType: (() => {
                const types = [];
                if (isTrue(hospital.TYPE_HospTyp_ACH)) types.push("Acute Care Hospital");
                if (isTrue(hospital.TYPE_HospTyp_CAH)) types.push("Critical Access Hospital");
                if (isTrue(hospital.TYPE_AMC)) types.push("Academic Medical Center");
                if (isTrue(hospital.TYPE_ForProfit)) types.push("For-Profit");
                if (isTrue(hospital.TYPE_NonProfit)) types.push("Nonprofit");
                if (isTrue(hospital.TYPE_chrch_affl_f)) types.push("Faith-Affiliated");
                if (isTrue(hospital.TYPE_isSafetyNet)) types.push("Safety Net Hospital");
                return types.length ? types.join(", ") : "—";
            })(),
            hospitalCareLevel: (() => {
                if (isTrue(hospital.TYPE_HospTyp_CAH)) return "Critical Access";
                if (isTrue(hospital.TYPE_HospTyp_ACH)) return "Acute Care";
                if (isTrue(hospital.TYPE_AMC)) return "Academic / Teaching";
                return "—";
            })(),
            hospitalSystem: isTrue(hospital.HOSPITAL_SYSTEM)
                ? "Part of a Health System"
                : "Independent",
            hospitalUrbanRural: (() => {
                if (isTrue(hospital.TYPE_urban)) return "Urban";
                if (isTrue(hospital.TYPE_rural)) return "Rural";
                return "—";
            })(),
            hospitalBeds: "—"
        };

        // Apply infoMap values to page
        for (const [id, val] of Object.entries(infoMap)) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }

        // ===== Services =====
        const list = document.getElementById("hospitalServices");
        list.innerHTML = "";
        
        const services = [
            "Behavioral Health",
            "Cardiology",
            "Emergency Care",
            "Imaging & Radiology",
            "Maternity & Neonatal ICU",
            "Oncology",
            "Orthopedics",
            "Outpatient Surgery",
            "Pediatric Services",
            "Pharmacy",
            "Physical Therapy",
            "Rehabilitation"
        ];

        list.innerHTML = services.map(s => `<li>${s}</li>`).join("");

        // ===== Overall Grade =====
        const overallGrade = hospital["TIER_1_GRADE_Lown_Composite"] || "N/A";
        const starWrap = document.getElementById("overallStars");
        if (starWrap)
            starWrap.innerHTML = renderStars(
                convertGradeToStars(overallGrade).value,
                overallGrade
            );

        // ===== Category-level stars =====
        const categoryMap = {
            financialTransparencyStars: hospital["TIER_2_GRADE_Value"] || "N/A",
            communityBenefitStars: hospital["TIER_3_GRADE_CB"] || "N/A",
            affordabilityBillingStars: hospital["TIER_3_GRADE_Cost_Eff"] || "N/A",
            accessResponsibilityStars: hospital["TIER_3_GRADE_Inclusivity"] || "N/A"
        };

        for (const [id, grade] of Object.entries(categoryMap)) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = renderStars(convertGradeToStars(grade).value, grade);
        }

        // ===== Map =====
        const mapDiv = document.getElementById("leafletMap");
        if (mapDiv) {
            let lat = parseFloat(hospital["Latitude"]);
            let lon = parseFloat(hospital["Longitude"]);

            if (!lat || !lon) {
                const coords = getZipCoords(hospital.Zip);
                lat = coords[0];
                lon = coords[1];
            }

            const map = L.map(mapDiv).setView([lat, lon], 13);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "&copy; OpenStreetMap contributors"
            }).addTo(map);

            L.marker([lat, lon]).addTo(map).bindPopup(hospitalName);

            document.getElementById("gmapsLink").href =
                `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        }
    } catch (err) {
        console.error("Error loading hospital details:", err);
    }
});

// ====== STAR UTILITIES ======
function convertGradeToStars(grade) {
    const gradeMap = {
        "A+": 5, "A": 5, "A-": 4.5,
        "B+": 4.5, "B": 4, "B-": 3.5,
        "C+": 3.5, "C": 3, "C-": 2.5,
        "D+": 2.5, "D": 2, "D-": 1.5,
        "F": 1
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

// ====== ZIPCODE FALLBACK FUNCTION ======
function getZipCoords(zip) {
    const lookup = {
        "30303": [33.7525, -84.3915],
        "31401": [32.0809, -81.0912],
        "31201": [32.8306, -83.6513],
        "30901": [33.4708, -81.9749],
        "31901": [32.4640, -84.9877],
        "30601": [33.9590, -83.3767]
    };
    return lookup[String(zip)] || [32.5, -83.5];
}
