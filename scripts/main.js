// ===============================
// Sort Functionality
// ===============================
document.getElementById("sortSelect").addEventListener("change", () => {
    sortAndRender(filteredHospitals || hospitalData);
});

// ===============================
// Sidebar Filter Implementation
// ===============================
let filteredHospitals = [];

function setupSidebarFilters() {
    // Hospital Type Filters
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyAllFilters);
    });
    
    // Location Search
    document.getElementById('applyLocationBtn').addEventListener('click', applyAllFilters);
    
    // Sort dropdown
    document.getElementById('sortSelect').addEventListener('change', () => {
        sortAndRender(filteredHospitals || hospitalData);
    });
}

function applyAllFilters() {
    let filtered = [...hospitalData];
    
    // Apply hospital type filters
    const typeFilters = getActiveTypeFilters();
    if (typeFilters.length > 0) {
        filtered = filtered.filter(hospital => {
            return typeFilters.some(filter => matchesHospitalType(hospital, filter));
        });
    }
    
    // Apply metric category filters
    const metricFilters = getActiveMetricFilters();
    if (metricFilters.length > 0) {
        filtered = filtered.filter(hospital => {
            // This would need to be customized based on your actual metric data structure
            return metricFilters.some(metric => hasMetricData(hospital, metric));
        });
    }
    
    // Apply location filter if ZIP code provided
    const zipCode = document.getElementById('zipInput').value.trim();
    if (zipCode) {
        const radius = parseInt(document.getElementById('radiusSelect').value);
        filtered = filterByLocation(filtered, zipCode, radius);
    }
    
    filteredHospitals = filtered;
    sortAndRender(filtered);
}

function getActiveTypeFilters() {
    const activeFilters = [];
    document.querySelectorAll('.filter-group input[type="checkbox"]:checked').forEach(checkbox => {
        activeFilters.push(checkbox.value);
    });
    return activeFilters;
}

function getActiveMetricFilters() {
    const activeMetrics = [];
    document.querySelectorAll('.filter-group input[type="checkbox"]:checked').forEach(checkbox => {
        activeMetrics.push(checkbox.value);
    });
    return activeMetrics;
}

function matchesHospitalType(hospital, filterType) {
    const typeMap = {
        'Urban': () => hospital.TYPE_urban === 1 || hospital.TYPE_urban === '1' || hospital.TYPE_urban === true,
        'Rural': () => hospital.TYPE_rural === 1 || hospital.TYPE_rural === '1' || hospital.TYPE_rural === true,
        'Non-profit': () => hospital.TYPE_NonProfit === 1 || hospital.TYPE_NonProfit === '1' || hospital.TYPE_NonProfit === true,
        'For Profit': () => hospital.TYPE_ForProfit === 1 || hospital.TYPE_ForProfit === '1' || hospital.TYPE_ForProfit === true,
        'Church Affiliated': () => hospital.TYPE_chrch_affl_f === 1 || hospital.TYPE_chrch_affl_f === '1' || hospital.TYPE_chrch_affl_f === true,
        'Academic Medical Center': () => hospital.TYPE_AMC === 1 || hospital.TYPE_AMC === '1' || hospital.TYPE_AMC === true,
        'Safety Net': () => hospital.TYPE_isSafetyNet === 1 || hospital.TYPE_isSafetyNet === '1' || hospital.TYPE_isSafetyNet === true
    };
    
    return typeMap[filterType] ? typeMap[filterType]() : false;
}

function hasMetricData(hospital, metricCategory) {
    // Map metric categories to actual data fields in your JSON
    const metricMap = {
        'Financial Transparency and Institutional Health': () => 
            hospital.TIER_2_GRADE_Value || hospital.TIER_3_GRADE_Exec_Comp,
        'Community Benefit Spending': () => 
            hospital.TIER_3_GRADE_CB,
        'Healthcare Affordability and Billing': () => 
            hospital.TIER_3_GRADE_Cost_Eff,
        'Healthcare Access and Social Responsibility': () => 
            hospital.TIER_3_GRADE_Inclusivity
    };
    
    return metricMap[metricCategory] ? metricMap[metricCategory]() : false;
}

function filterByLocation(hospitals, zipCode, radiusMiles) {
    // Simple implementation - in a real app you'd use geocoding API
    // This filters hospitals with matching ZIP code
    return hospitals.filter(hospital => 
        hospital.Zip && hospital.Zip.toString().includes(zipCode)
    );
}

// ===============================
// Enhanced Sort Function
// ===============================
function sortAndRender(data) {
    const sortValue = document.getElementById("sortSelect").value;
    let sorted = [...data];

    switch(sortValue) {
        case "grade":
            const gradeOrder = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
            sorted.sort((a, b) => {
                const gradeA = gradeOrder[a.TIER_1_GRADE_Lown_Composite] || 0;
                const gradeB = gradeOrder[b.TIER_1_GRADE_Lown_Composite] || 0;
                return gradeB - gradeA; // High to low
            });
            break;
            
        case "distance":
            // Sort by distance if available, otherwise keep original order
            sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            break;
            
        case "name":
            sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
            break;
            
        case "size":
            const sizeOrder = { 'Extra Small': 1, 'Small': 2, 'Medium': 3, 'Large': 4, 'Extra Large': 5 };
            sorted.sort((a, b) => {
                const sizeA = sizeOrder[a.Size] || 0;
                const sizeB = sizeOrder[b.Size] || 0;
                return sizeA - sizeB;
            });
            break;
    }

    renderHospitals(sorted);
    updateMapMarkers(sorted);
}

// ===============================
// Reset Filters Enhancement
// ===============================
document.getElementById("resetFiltersBtn").addEventListener("click", () => {
    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Clear location inputs
    document.getElementById("zipInput").value = "";
    document.getElementById("radiusSelect").selectedIndex = 0;
    
    // Reset sort to default
    document.getElementById("sortSelect").selectedIndex = 0;
    
    // Reset view toggles
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('viewSystemsBtn').classList.add('active');
    document.getElementById('individualOptions').style.display = 'none';
    
    console.log("All filters reset");
    filteredHospitals = [...hospitalData];
    renderHospitals(hospitalData);
    updateMapMarkers(hospitalData);
});

// ===============================
// Initialize everything when data loads
// ===============================
fetch("./data/2025/2025_Lown_Index_GA.json")
  .then(res => res.json())
  .then(data => {
    hospitalData = data;
    filteredHospitals = [...hospitalData];
    console.log("Hospital data loaded:", hospitalData.length, "records");

    // Initialize all functionality
    renderHospitals(hospitalData);
    initHospitalMap(hospitalData);
    setupSidebarFilters(); // Add this line
    
  })
  .catch(err => console.error("Error loading JSON:", err));
