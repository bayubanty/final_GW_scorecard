// ===============================
// Hospital Comparison Script
// ===============================

let hospitalData = [];
let selectedHospitals = {
    hospital1: null,
    hospital2: null
};

// Load hospital data
document.addEventListener('DOMContentLoaded', function() {
    loadHospitalData();
    initializeEventListeners();
    initMobileNavigation();
});

async function loadHospitalData() {
    try {
        const response = await fetch('./data/2025/2025_Lown_Index_GA.json');
        hospitalData = await response.json();
        console.log('Hospital data loaded for comparison:', hospitalData.length, 'hospitals');
    } catch (error) {
        console.error('Error loading hospital data for comparison:', error);
    }
}

function initializeEventListeners() {
    // Search functionality
    document.getElementById('searchHospital1').addEventListener('input', (e) => {
        handleSearch(e.target.value, 'hospital1');
    });
    
    document.getElementById('searchHospital2').addEventListener('input', (e) => {
        handleSearch(e.target.value, 'hospital2');
    });

    // Compare button
    document.getElementById('compareNowBtn').addEventListener('click', compareHospitals);
    
    // Clear selection
    document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);
    
    // Back to selection
    document.getElementById('backToSelectionBtn').addEventListener('click', backToSelection);
    
    // Category toggles
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', toggleCategory);
    });
}

function handleSearch(query, hospitalSlot) {
    const resultsContainer = document.getElementById(`results${hospitalSlot.charAt(0).toUpperCase() + hospitalSlot.slice(1)}`);
    
    if (query.length < 2) {
        resultsContainer.classList.remove('active');
        return;
    }
    
    const filteredHospitals = hospitalData.filter(hospital => 
        hospital.Name.toLowerCase().includes(query.toLowerCase()) ||
        hospital.City.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
    
    displaySearchResults(filteredHospitals, resultsContainer, hospitalSlot);
    resultsContainer.classList.add('active');
}

function displaySearchResults(hospitals, container, hospitalSlot) {
    container.innerHTML = '';
    
    if (hospitals.length === 0) {
        container.innerHTML = '<div class="search-result-item">No hospitals found</div>';
        return;
    }
    
    hospitals.forEach(hospital => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.innerHTML = `
            <div class="hospital-name">${hospital.Name || 'Unnamed Hospital'}</div>
            <div class="hospital-location">${hospital.City || ''}, ${hospital.State || ''}</div>
        `;
        
        resultItem.addEventListener('click', () => {
            selectHospital(hospital, hospitalSlot);
            container.classList.remove('active');
            document.getElementById(`search${hospitalSlot.charAt(0).toUpperCase() + hospitalSlot.slice(1)}`).value = '';
        });
        
        container.appendChild(resultItem);
    });
}

function selectHospital(hospital, slot) {
    selectedHospitals[slot] = hospital;
    updateSelectedHospitalDisplay(hospital, slot);
    updateCompareButton();
}

function updateSelectedHospitalDisplay(hospital, slot) {
    const container = document.getElementById(`selected${slot.charAt(0).toUpperCase() + slot.slice(1)}`);
    const grade = hospital.TIER_1_GRADE_Lown_Composite || 'N/A';
    
    container.innerHTML = `
        <div class="hospital-preview">
            <h4>${hospital.Name || 'Unnamed Hospital'}</h4>
            <div class="location">${hospital.City || ''}, ${hospital.State || ''}</div>
            <div class="grade">Overall Grade: ${grade}</div>
        </div>
    `;
    container.classList.add('hospital-selected');
}

function updateCompareButton() {
    const compareBtn = document.getElementById('compareNowBtn');
    const hasBothHospitals = selectedHospitals.hospital1 && selectedHospitals.hospital2;
    compareBtn.disabled = !hasBothHospitals;
}

function clearSelection() {
    selectedHospitals.hospital1 = null;
    selectedHospitals.hospital2 = null;
    
    // Reset displays
    document.getElementById('selectedHospital1').innerHTML = '<p class="placeholder">No hospital selected</p>';
    document.getElementById('selectedHospital2').innerHTML = '<p class="placeholder">No hospital selected</p>';
    document.getElementById('selectedHospital1').classList.remove('hospital-selected');
    document.getElementById('selectedHospital2').classList.remove('hospital-selected');
    
    // Clear search inputs and results
    document.getElementById('searchHospital1').value = '';
    document.getElementById('searchHospital2').value = '';
    document.getElementById('resultsHospital1').classList.remove('active');
    document.getElementById('resultsHospital2').classList.remove('active');
    
    updateCompareButton();
    backToSelection();
}

function compareHospitals() {
    if (!selectedHospitals.hospital1 || !selectedHospitals.hospital2) return;
    
    // Hide selection section, show results
    document.querySelector('.selection-section').style.display = 'none';
    document.getElementById('comparisonResults').style.display = 'block';
    
    // Populate comparison
    populateComparison();
}

function backToSelection() {
    document.querySelector('.selection-section').style.display = 'block';
    document.getElementById('comparisonResults').style.display = 'none';
}

function toggleCategory(event) {
    const header = event.currentTarget;
    const content = header.nextElementSibling;
    
    header.classList.toggle('active');
    content.classList.toggle('active');
}

function populateComparison() {
    const comparisonGrid = document.getElementById('comparisonGrid');
    comparisonGrid.innerHTML = '';
    
    // Define comparison categories and metrics
    const categories = [
        {
            name: 'Overall Performance',
            metrics: [
                { key: 'TIER_1_GRADE_Lown_Composite', label: 'Overall Grade' },
                { key: 'Size', label: 'Hospital Size' },
                { key: 'TYPE_NonProfit', label: 'Hospital Type', format: (val) => val === 1 ? 'Non-profit' : 'For-profit' },
                { key: 'TYPE_urban', label: 'Setting', format: (val) => val === 1 ? 'Urban' : 'Rural' }
            ]
        },
        {
            name: 'Financial Transparency & Institutional Health',
            metrics: [
                { key: 'TIER_2_GRADE_Value', label: 'Value Grade' },
                { key: 'TIER_3_GRADE_Exec_Comp', label: 'Executive Compensation Grade' }
            ]
        },
        {
            name: 'Community Benefit Spending',
            metrics: [
                { key: 'TIER_3_GRADE_CB', label: 'Community Benefit Grade' }
            ]
        },
        {
            name: 'Healthcare Affordability & Billing',
            metrics: [
                { key: 'TIER_3_GRADE_Cost_Eff', label: 'Cost Effectiveness Grade' }
            ]
        },
        {
            name: 'Healthcare Access & Social Responsibility',
            metrics: [
                { key: 'TIER_3_GRADE_Inclusivity', label: 'Inclusivity Grade' },
                { key: 'TIER_2_GRADE_Civic', label: 'Civic Leadership Grade' }
            ]
        },
        {
            name: 'Patient Outcomes & Experience',
            metrics: [
                { key: 'TIER_2_GRADE_Outcome', label: 'Outcome Grade' },
                { key: 'TIER_3_GRADE_Pat_Saf', label: 'Patient Safety Grade' },
                { key: 'TIER_3_GRADE_Pat_Exp', label: 'Patient Experience Grade' }
            ]
        }
    ];
    
    categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        comparisonGrid.appendChild(categoryElement);
    });
}

function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'comparison-category';
    
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
        <h3>${category.name}</h3>
        <span class="category-toggle">▼</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'category-content';
    
    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';
    
    category.metrics.forEach(metric => {
        const metricRow = createMetricRow(metric);
        metricsGrid.appendChild(metricRow);
    });
    
    content.appendChild(metricsGrid);
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(content);
    
    // Add click event for toggle
    header.addEventListener('click', toggleCategory);
    
    return categoryDiv;
}

function createMetricRow(metric) {
    const metricRow = document.createElement('div');
    metricRow.className = 'metric-row';
    
    const hospital1Value = getFormattedValue(selectedHospitals.hospital1, metric);
    const hospital2Value = getFormattedValue(selectedHospitals.hospital2, metric);
    
    metricRow.innerHTML = `
        <div class="metric-name">${metric.label}</div>
        <div class="metric-divider">vs</div>
        <div class="metric-values">
            <div class="metric-value hospital-1-value">
                <span class="metric-value-text">${hospital1Value}</span>
                ${isGradeMetric(metric.key) ? `<span class="metric-grade grade-${selectedHospitals.hospital1[metric.key] || 'N/A'}">${selectedHospitals.hospital1[metric.key] || 'N/A'}</span>` : ''}
            </div>
            <div class="metric-value hospital-2-value">
                <span class="metric-value-text">${hospital2Value}</span>
                ${isGradeMetric(metric.key) ? `<span class="metric-grade grade-${selectedHospitals.hospital2[metric.key] || 'N/A'}">${selectedHospitals.hospital2[metric.key] || 'N/A'}</span>` : ''}
            </div>
        </div>
    `;
    
    return metricRow;
}

function getFormattedValue(hospital, metric) {
    const value = hospital[metric.key];
    
    if (metric.format) {
        return metric.format(value);
    }
    
    if (value === null || value === undefined || value === 'NULL') {
        return 'N/A';
    }
    
    if (isGradeMetric(metric.key)) {
        return value;
    }
    
    return value;
}

function isGradeMetric(key) {
    return key.includes('GRADE');
}

// Close search results when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-box')) {
        document.querySelectorAll('.search-results').forEach(container => {
            container.classList.remove('active');
        });
    }
});
