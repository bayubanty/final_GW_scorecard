// ===============================
// Hospital Comparison Script 
// Robust data mapping for comparison features
// ===============================

let hospitalData = [];
let selectedHospitals = {
    hospital1: null,
    hospital2: null
};

// Load hospital data
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing hospital comparison...");
    loadHospitalData();
    initializeEventListeners();
    initMobileNavigation();
});

async function loadHospitalData() {
    try {
        const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        hospitalData = await response.json();
        console.log('Hospital data loaded for comparison:', hospitalData.length, 'hospitals');
        populateHospitalDropdowns();
        
    } catch (error) {
        console.error('Error loading hospital data for comparison:', error);
        showComparisonError('Failed to load hospital data. Please refresh the page.');
    }
}

// ===============================
// Flexible Data Access Utilities
// ===============================

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

function getHospitalId(hospital) {
    return getHospitalField(hospital, [
        'RECORD_ID', 'RecordID', 'record_id', 'ID', 'id', 'HospitalID', 'hospital_id'
    ]);
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
// Dropdown Population
// ===============================

function populateHospitalDropdowns() {
    const hospital1Select = document.getElementById('hospital1Select');
    const hospital2Select = document.getElementById('hospital2Select');

    if (!hospital1Select || !hospital2Select) {
        console.error('Hospital dropdown elements not found');
        return;
    }

    // Clear existing options except the first one
    while (hospital1Select.options.length > 1) hospital1Select.remove(1);
    while (hospital2Select.options.length > 1) hospital2Select.remove(1);

    // Sort hospitals by name for easier selection
    const sortedHospitals = [...hospitalData].sort((a, b) => {
        const nameA = getHospitalName(a);
        const nameB = getHospitalName(b);
        return nameA.localeCompare(nameB);
    });

    // Populate dropdowns
    sortedHospitals.forEach(hospital => {
        const name = getHospitalName(hospital);
        const city = getHospitalField(hospital, ['City', 'city'], '');
        const state = getHospitalField(hospital, ['State', 'state'], '');
        const location = `${city}, ${state}`.replace(', ,', ',').replace(/^, |, $/g, '').trim();
        const optionText = location ? `${name} - ${location}` : name;
        
        const option1 = new Option(optionText, getHospitalId(hospital));
        const option2 = new Option(optionText, getHospitalId(hospital));
        
        hospital1Select.add(option1);
        hospital2Select.add(option2);
    });

    console.log(`Populated dropdowns with ${sortedHospitals.length} hospitals`);
}

// ===============================
// Event Listeners
// ===============================

function initializeEventListeners() {
    // Dropdown change events
    document.getElementById('hospital1Select').addEventListener('change', (e) => {
        const hospitalId = e.target.value;
        if (hospitalId) {
            const hospital = hospitalData.find(h => getHospitalId(h) == hospitalId);
            selectHospital(hospital, 'hospital1');
        } else {
            clearHospitalSelection('hospital1');
        }
    });

    document.getElementById('hospital2Select').addEventListener('change', (e) => {
        const hospitalId = e.target.value;
        if (hospitalId) {
            const hospital = hospitalData.find(h => getHospitalId(h) == hospitalId);
            selectHospital(hospital, 'hospital2');
        } else {
            clearHospitalSelection('hospital2');
        }
    });

    // Action buttons
    document.getElementById('compareNowBtn').addEventListener('click', compareHospitals);
    document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);
    document.getElementById('backToSelectionBtn').addEventListener('click', backToSelection);
}

function selectHospital(hospital, slot) {
    if (!hospital) return;
    
    selectedHospitals[slot] = hospital;
    updateSelectedHospitalDisplay(hospital, slot);
    updateCompareButton();
}

function clearHospitalSelection(slot) {
    selectedHospitals[slot] = null;
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    if (container) {
        container.innerHTML = '<p class="placeholder">No hospital selected</p>';
        container.classList.remove('hospital-selected');
    }
    updateCompareButton();
}

function updateSelectedHospitalDisplay(hospital, slot) {
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    if (!container) return;

    const hospitalName = getHospitalName(hospital);
    const city = getHospitalField(hospital, ['City', 'city'], '');
    const state = getHospitalField(hospital, ['State', 'state'], '');
    const grade = getHospitalGrade(hospital, 'overall');
    const stars = convertGradeToStars(grade);

    container.innerHTML = `
        <div class="hospital-preview">
            <h4>${hospitalName}</h4>
            <div class="location">${city}${city && state ? ', ' : ''}${state}</div>
            <div class="type">${getHospitalTypeShort(hospital)} • ${getUrbanRuralShort(hospital)}</div>
            <div class="grade">
                Overall Grade:
                <div class="star-rating">${renderStars(stars.value)}</div>
            </div>
        </div>
    `;
    container.classList.add('hospital-selected');
}

function updateCompareButton() {
    const compareBtn = document.getElementById('compareNowBtn');
    if (compareBtn) {
        const hasBothHospitals = selectedHospitals.hospital1 && selectedHospitals.hospital2;
        compareBtn.disabled = !hasBothHospitals;
    }
}

function clearSelection() {
    selectedHospitals.hospital1 = null;
    selectedHospitals.hospital2 = null;

    // Reset displays
    ['Hospital1', 'Hospital2'].forEach(slot => {
        const container = document.getElementById(`selected${slot}`);
        if (container) {
            container.innerHTML = '<p class="placeholder">No hospital selected</p>';
            container.classList.remove('hospital-selected');
        }
    });

    // Reset dropdowns
    document.getElementById('hospital1Select').value = '';
    document.getElementById('hospital2Select').value = '';

    updateCompareButton();
    backToSelection();
}

function compareHospitals() {
    if (!selectedHospitals.hospital1 || !selectedHospitals.hospital2) return;

    // Hide selection section, show results
    const selectionSection = document.querySelector('.selection-section');
    const resultsSection = document.getElementById('comparisonResults');
    
    if (selectionSection) selectionSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'block';

    // Populate comparison
    populateComparison();
}

function backToSelection() {
    const selectionSection = document.querySelector('.selection-section');
    const resultsSection = document.getElementById('comparisonResults');
    
    if (selectionSection) selectionSection.style.display = 'block';
    if (resultsSection) resultsSection.style.display = 'none';
}

// ===============================
// Comparison Display
// ===============================

function populateComparison() {
    const comparisonGrid = document.getElementById('comparisonGrid');
    if (!comparisonGrid) return;

    comparisonGrid.innerHTML = '';

    // Define comparison categories and metrics
    const categories = [
        {
            name: 'Overall Performance',
            metrics: [
                { key: 'overall', label: 'Overall Grade', isGrade: true },
                { key: 'size', label: 'Hospital Size', format: getHospitalSize },
                { key: 'type', label: 'Hospital Type', format: getHospitalTypeShort },
                { key: 'setting', label: 'Setting', format: getUrbanRuralShort },
                { key: 'beds', label: 'Bed Count', format: (hospital) => getHospitalField(hospital, ['Beds', 'Bed_Count', 'beds']) }
            ]
        },
        {
            name: 'Financial Transparency & Institutional Health',
            metrics: [
                { key: 'value', label: 'Value Grade', isGrade: true },
                { key: 'executive', label: 'Executive Compensation Grade', isGrade: true }
            ]
        },
        {
            name: 'Community Benefit Spending',
            metrics: [
                { key: 'community', label: 'Community Benefit Grade', isGrade: true }
            ]
        },
        {
            name: 'Healthcare Affordability & Billing',
            metrics: [
                { key: 'cost', label: 'Cost Effectiveness Grade', isGrade: true }
            ]
        },
        {
            name: 'Healthcare Access & Social Responsibility',
            metrics: [
                { key: 'inclusivity', label: 'Inclusivity Grade', isGrade: true },
                { key: 'civic', label: 'Civic Leadership Grade', isGrade: true }
            ]
        },
        {
            name: 'Patient Outcomes & Experience',
            metrics: [
                { key: 'outcome', label: 'Outcome Grade', isGrade: true },
                { key: 'safety', label: 'Patient Safety Grade', isGrade: true },
                { key: 'experience', label: 'Patient Experience Grade', isGrade: true }
            ]
        }
    ];

    categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        comparisonGrid.appendChild(categoryElement);
    });

    // Add click events for category toggles
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
}

function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'comparison-category';

    const header = document.createElement('div');
    header.className = 'category-header active';
    header.innerHTML = `
        <h3>${category.name}</h3>
        <span class="category-toggle">▼</span>
    `;

    const content = document.createElement('div');
    content.className = 'category-content active';

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';

    category.metrics.forEach(metric => {
        const metricRow = createMetricRow(metric);
        if (metricRow) metricsGrid.appendChild(metricRow);
    });

    content.appendChild(metricsGrid);
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(content);

    return categoryDiv;
}

function createMetricRow(metric) {
    const hospital1 = selectedHospitals.hospital1;
    const hospital2 = selectedHospitals.hospital2;

    if (!hospital1 || !hospital2) return null;

    const hospital1Value = getFormattedValue(hospital1, metric);
    const hospital2Value = getFormattedValue(hospital2, metric);

    // Skip if both values are unavailable
    if ((hospital1Value === 'N/A' || hospital1Value === '---') && 
        (hospital2Value === 'N/A' || hospital2Value === '---')) {
        return null;
    }

    const metricRow = document.createElement('div');
    metricRow.className = 'metric-row';

    metricRow.innerHTML = `
        <div class="metric-name">${metric.label}</div>
        <div class="metric-divider">vs</div>
        <div class="metric-values">
            <div class="metric-value hospital-1-value">
                <div class="metric-value-content">
                    ${metric.isGrade ? 
                        `<div class="star-comparison">${renderStars(convertGradeToStars(hospital1Value).value)}</div>` :
                        `<span class="metric-value-text">${hospital1Value}</span>`
                    }
                </div>
            </div>
            <div class="metric-value hospital-2-value">
                <div class="metric-value-content">
                    ${metric.isGrade ? 
                        `<div class="star-comparison">${renderStars(convertGradeToStars(hospital2Value).value)}</div>` :
                        `<span class="metric-value-text">${hospital2Value}</span>`
                    }
                </div>
            </div>
        </div>
    `;

    return metricRow;
}

function getFormattedValue(hospital, metric) {
    if (!hospital) return 'N/A';
    
    if (metric.format) {
        return metric.format(hospital);
    }
    
    if (metric.isGrade) {
        return getHospitalGrade(hospital, metric.key);
    }
    
    return 'N/A';
}

function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    header.classList.toggle('active');
    content.classList.toggle('active');
}

// ===============================
// Helper Functions
// ===============================

function getHospitalTypeShort(hospital) {
    if (!hospital) return "Hospital";
    
    if (getHospitalField(hospital, ['TYPE_HospTyp_CAH', 'Critical_Access'])) return "Critical Access";
    if (getHospitalField(hospital, ['TYPE_HospTyp_ACH', 'Acute_Care'])) return "Acute Care";
    if (getHospitalField(hospital, ['TYPE_AMC', 'Academic_Medical_Center'])) return "Academic";
    if (getHospitalField(hospital, ['TYPE_NonProfit', 'Nonprofit'])) return "Nonprofit";
    if (getHospitalField(hospital, ['TYPE_ForProfit', 'For_Profit'])) return "For-Profit";
    
    return "Hospital";
}

function getUrbanRuralShort(hospital) {
    if (!hospital) return "---";
    
    if (getHospitalField(hospital, ['TYPE_urban', 'Urban'])) return "Urban";
    if (getHospitalField(hospital, ['TYPE_rural', 'Rural'])) return "Rural";
    
    return "---";
}

function getHospitalSize(hospital) {
    const size = getHospitalField(hospital, ['Size', 'size']);
    const sizeMap = {
        'xs': 'Extra Small', 's': 'Small', 'm': 'Medium', 'l': 'Large', 'xl': 'Extra Large',
        'extra small': 'Extra Small', 'small': 'Small', 'medium': 'Medium', 'large': 'Large', 'extra large': 'Extra Large'
    };
    return sizeMap[String(size).toLowerCase()] || size || "---";
}

// ===============================
// Star Rating Utilities
// ===============================

function convertGradeToStars(grade) {
    const gradeMap = {
        'A+': 5, 'A': 5, 'A-': 4.5, 'B+': 4.5, 'B': 4, 'B-': 3.5,
        'C+': 3.5, 'C': 3, 'C-': 2.5, 'D+': 2.5, 'D': 2, 'D-': 1.5,
        'F': 1, 'N/A': 0
    };
    const value = gradeMap[String(grade).trim()] || 0;
    return { value };
}

function renderStars(value) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (value >= i) html += fullStarSVG();
        else if (value >= i - 0.5) html += halfStarSVG();
        else html += emptyStarSVG();
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

// ===============================
// Error Handling
// ===============================

function showComparisonError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'comparison-error';
    errorDiv.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px; text-align: center;">
            <strong>Error:</strong> ${message}
        </div>
    `;
    document.querySelector('.compare-container').prepend(errorDiv);
}
