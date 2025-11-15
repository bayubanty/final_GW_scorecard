// ===============================
// Main Application Logic
// Enhanced data handling with robust field mapping
// ===============================

// Data Storage
let hospitalData = [];
let filteredHospitalData = [];

// Map variables
let map = null;
let mobileMap = null;
let mapMarkers = [];
let mobileMapMarkers = [];

// ===============================
// Load JSON Data
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Georgia Hospital Scorecard...");
    loadHospitalData();
    initMobileUI();
    setupEventListeners();
});

async function loadHospitalData() {
    try {
        showMainLoading();
        
        console.log("Loading hospital data from JSON...");
        const response = await fetch('./data/2025/2025_GW_HospitalScores.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Raw JSON data loaded:", data);
        
        // Validate data structure
        if (!Array.isArray(data)) {
            throw new Error("Data is not an array - expected array of hospitals");
        }
        
        if (data.length === 0) {
            console.warn("No hospital data found in JSON file");
            showErrorPopup("No hospital data found. Please check the data file.");
        } else {
            console.log(`Found ${data.length} hospital records`);
            
            // Debug: Show first hospital structure
            const firstHospital = data[0];
            console.log("First hospital structure:", firstHospital);
            console.log("Available fields:", Object.keys(firstHospital));
        }
        
        hospitalData = data;
        filteredHospitalData = [...hospitalData];
        
        // Initial render
        renderHospitals(hospitalData);
        initHospitalMap(hospitalData);
        initMobileMap(hospitalData);
        
        hideMainLoading();
        
    } catch (error) {
        console.error("Error loading hospital data:", error);
        hideMainLoading();
        showErrorPopup(`Failed to load hospital data: ${error.message}`);
    }
}

// ===============================
// Flexible Field Access Utilities
// ===============================

function getHospitalField(hospital, possibleFields) {
    if (!hospital) return 'Unnamed Hospital';
    
    for (const field of possibleFields) {
        const value = hospital[field];
        if (value !== undefined && value !== null && value !== '' && value !== 'NULL') {
            return value;
        }
    }
    return 'Unnamed Hospital';
}

function getHospitalName(hospital) {
    return getHospitalField(hospital, [
        'Name', 'HospitalName', 'HOSPITAL_NAME', 'Hospital_Name', 
        'name', 'hospital_name', 'FacilityName', 'facility_name'
    ]);
}

function getHospitalId(hospital) {
    return getHospitalField(hospital, [
        'RECORD_ID', 'RecordID', 'record_id', 'ID', 'id', 'HospitalID', 'hospital_id'
    ]);
}

function getHospitalGrade(hospital) {
    return getHospitalField(hospital, [
        'TIER_1_GRADE_Lown_Composite', 'Overall_Grade', 'Grade', 'grade',
        'OverallGrade', 'Composite_Grade', 'composite_grade'
    ]);
}

// ===============================
// Render Hospitals - UPDATED
// ===============================

function renderHospitals(data) {
    const resultsTable = document.getElementById('hospitalResults');
    const resultsCount = document.getElementById('resultsCount');
    
    if (!resultsTable) {
        console.error("Results table element not found!");
        return;
    }
    
    // Clear old results
    resultsTable.innerHTML = '';
    
    // Update results count
    const countText = `Viewing ${data.length} ${data.length === 1 ? 'result' : 'results'}`;
    if (resultsCount) {
        resultsCount.textContent = countText;
    }
    
    if (!data.length) {
        resultsTable.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px;">No hospitals match the selected filters.</td></tr>`;
        return;
    }
    
    console.log(`Rendering ${data.length} hospitals...`);
    
    data.forEach((hospital, index) => {
        // Get hospital data with fallbacks
        const hospitalName = getHospitalName(hospital);
        const hospitalId = getHospitalId(hospital);
        const grade = getHospitalGrade(hospital) || 'N/A';
        const stars = convertGradeToStars(grade);
        
        console.log(`Hospital ${index + 1}:`, { name: hospitalName, id: hospitalId, grade: grade });
        
        // === Main Row ===
        const row = document.createElement('tr');
        row.classList.add('hospital-row');
        
        // Grade Cell
        const gradeCell = document.createElement('td');
        gradeCell.innerHTML = `
            <div class="star-rating" aria-label="${stars.value} out of 5 stars">
                ${renderStars(stars.value)}
            </div>
        `;
        row.appendChild(gradeCell);
        
        // Name Cell
        const nameCell = document.createElement('td');
        nameCell.innerHTML = `
            <strong>
                <a href="details.html?id=${hospitalId}" class="hospital-link">
                    ${hospitalName}
                </a>
            </strong><br>
            ${hospital.City || ''}, ${hospital.State || ''}<br>
            <small style="color: #666; font-size: 0.9em;">${getHospitalTypeShort(hospital)} • ${getUrbanRuralShort(hospital)}</small>
        `;
        row.appendChild(nameCell);
        
        // Buttons Cell
        const buttonCell = document.createElement('td');
        buttonCell.classList.add('details-buttons');
        
        const detailsButton = document.createElement('button');
        detailsButton.textContent = 'View Details ▼';
        detailsButton.classList.add('toggle-detail');
        
        const fullDetailsButton = document.createElement('button');
        fullDetailsButton.textContent = 'View Full Details';
        fullDetailsButton.classList.add('view-full-detail');
        fullDetailsButton.addEventListener('click', () => {
            if (hospitalId && hospitalId !== 'Unnamed Hospital') {
                window.location.href = `details.html?id=${hospitalId}`;
            } else {
                showErrorPopup('Sorry, we couldn\'t find more details for this hospital.');
            }
        });
        
        buttonCell.appendChild(detailsButton);
        buttonCell.appendChild(fullDetailsButton);
        row.appendChild(buttonCell);
        
        // === Detail Row (collapsed preview) ===
        const detailRow = document.createElement('tr');
        detailRow.classList.add('hospital-detail-row');
        detailRow.style.display = 'none';
        
        const detailCell = document.createElement('td');
        detailCell.colSpan = 3;
        
        // Get additional grades with fallbacks
        const outcomeGrade = getHospitalField(hospital, ['TIER_2_GRADE_Outcome', 'Outcome_Grade', 'Outcome']) || 'N/A';
        const valueGrade = getHospitalField(hospital, ['TIER_2_GRADE_Value', 'Value_Grade', 'Value']) || 'N/A';
        const civicGrade = getHospitalField(hospital, ['TIER_2_GRADE_Civic', 'Civic_Grade', 'Civic']) || 'N/A';
        const safetyGrade = getHospitalField(hospital, ['TIER_3_GRADE_Pat_Saf', 'Safety_Grade', 'Safety']) || 'N/A';
        const experienceGrade = getHospitalField(hospital, ['TIER_3_GRADE_Pat_Exp', 'Experience_Grade', 'Experience']) || 'N/A';
        
        detailCell.innerHTML = `
            <div class="detail-info">
                <p class="inline-stars"><strong>Outcome:</strong> 
                    ${renderStars(convertGradeToStars(outcomeGrade).value)}
                </p>
                <p class="inline-stars"><strong>Value:</strong> 
                    ${renderStars(convertGradeToStars(valueGrade).value)}
                </p>
                <p class="inline-stars"><strong>Civic:</strong> 
                    ${renderStars(convertGradeToStars(civicGrade).value)}
                </p>
                <p class="inline-stars"><strong>Safety:</strong> 
                    ${renderStars(convertGradeToStars(safetyGrade).value)}
                </p>
                <p class="inline-stars"><strong>Experience:</strong> 
                    ${renderStars(convertGradeToStars(experienceGrade).value)}
                </p>
                <p><strong>Type:</strong> ${getHospitalTypeShort(hospital)}</p>
                <p><strong>Location:</strong> ${getUrbanRuralShort(hospital)}</p>
                <p><strong>Size:</strong> ${getHospitalSize(hospital.Size)}</p>
            </div>
        `;
        detailRow.appendChild(detailCell);
        
        // === Toggle Logic ===
        detailsButton.addEventListener('click', () => {
            const isHidden = detailRow.style.display === 'none' || detailRow.style.display === '';
            detailRow.style.display = isHidden ? 'table-row' : 'none';
            detailsButton.textContent = isHidden ? 'Hide Details ▲' : 'View Details ▼';
        });
        
        // === Append both rows ===
        resultsTable.appendChild(row);
        resultsTable.appendChild(detailRow);
    });
    
    console.log("Finished rendering hospitals");
    
    // Update maps
    updateMapMarkers(data);
    updateMobileMapMarkers(data);
}

// ===============================
// Helper Functions
// ===============================

function getHospitalTypeShort(hospital) {
    if (!hospital) return "Hospital";
    
    if (hospital.TYPE_HospTyp_CAH || hospital["Critical Access"] || hospital.critical_access) return "Critical Access";
    if (hospital.TYPE_HospTyp_ACH || hospital["Acute Care"] || hospital.acute_care) return "Acute Care";
    if (hospital.TYPE_AMC || hospital["Academic Medical Center"] || hospital.academic) return "Academic";
    if (hospital.TYPE_NonProfit || hospital.Nonprofit || hospital.nonprofit) return "Nonprofit";
    if (hospital.TYPE_ForProfit || hospital["For Profit"] || hospital.for_profit) return "For-Profit";
    
    return "Hospital";
}

function getUrbanRuralShort(hospital) {
    if (!hospital) return "";
    
    if (hospital.TYPE_urban || hospital.Urban || hospital.urban) return "Urban";
    if (hospital.TYPE_rural || hospital.Rural || hospital.rural) return "Rural";
    
    return "";
}

function getHospitalSize(size) {
    if (!size) return "---";
    
    const sizeMap = {
        'xs': 'Extra Small', 's': 'Small', 'm': 'Medium', 'l': 'Large', 'xl': 'Extra Large',
        'extra small': 'Extra Small', 'small': 'Small', 'medium': 'Medium', 'large': 'Large', 'extra large': 'Extra Large'
    };
    return sizeMap[String(size).toLowerCase()] || size || "---";
}

// ===============================
// Mobile UI Functions
// ===============================

function initMobileUI() {
    initMobileEventListeners();
    initMobileNavigation();
}

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

function initMobileEventListeners() {
    // Mobile navigation
    document.querySelector('.mobile-nav-toggle')?.addEventListener('click', toggleMobileNavigation);
    document.querySelector('.mobile-nav-close')?.addEventListener('click', toggleMobileNavigation);
    document.querySelector('.mobile-nav-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) toggleMobileNavigation();
    });

    // Mobile filter toggle
    document.querySelector('.mobile-filter-toggle')?.addEventListener('click', toggleMobileFilters);
    document.querySelector('.mobile-filter-close')?.addEventListener('click', toggleMobileFilters);
    document.querySelector('.mobile-filter-overlay')?.addEventListener('click', function(e) {
        if (e.target === this) toggleMobileFilters();
    });

    // Mobile filter buttons
    document.getElementById('mobileApplyFiltersBtn')?.addEventListener('click', function() {
        applyAllFilters();
        toggleMobileFilters();
    });

    document.getElementById('mobileResetFiltersBtn')?.addEventListener('click', function() {
        resetAllFilters();
        setTimeout(() => toggleMobileFilters(), 100);
    });

    document.getElementById('mobileApplyLocationBtn')?.addEventListener('click', function() {
        applyAllFilters();
        toggleMobileFilters();
    });

    // Mobile view toggle synchronization
    const mobileViewSystemsBtn = document.getElementById('mobileViewSystemsBtn');
    const mobileViewIndividualsBtn = document.getElementById('mobileViewIndividualsBtn');
    const mobileCompareHospitalsBtn = document.getElementById('mobileCompareHospitalsBtn');

    mobileViewSystemsBtn?.addEventListener('click', function() {
        document.getElementById('viewSystemsBtn')?.click();
        syncMobileViewButtons();
    });

    mobileViewIndividualsBtn?.addEventListener('click', function() {
        document.getElementById('viewIndividualsBtn')?.click();
        syncMobileViewButtons();
    });

    mobileCompareHospitalsBtn?.addEventListener('click', function() {
        document.getElementById('compareHospitalsBtn')?.click();
        syncMobileViewButtons();
    });

    // Sync initial states
    syncFilterInputs();
}

function toggleMobileNavigation() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-nav-overlay');
    const panel = document.querySelector('.mobile-nav-panel');
    
    if (!overlay || !panel) return;
    
    body.classList.toggle('mobile-nav-open');
    overlay.style.display = body.classList.contains('mobile-nav-open') ? 'block' : 'none';
    
    setTimeout(() => panel.classList.toggle('active'), 10);
}

function toggleMobileFilters() {
    const body = document.body;
    const overlay = document.querySelector('.mobile-filter-overlay');
    const panel = document.querySelector('.mobile-filter-panel');
    
    body.classList.toggle('mobile-filter-open');
    overlay.style.display = body.classList.contains('mobile-filter-open') ? 'block' : 'none';
    
    setTimeout(() => {
        panel.classList.toggle('active');
        if (body.classList.contains('mobile-filter-open')) {
            syncMobileViewButtons();
            syncMobileFilterButtons();
            syncFilterInputs();
        }
    }, 10);
}

function syncMobileViewButtons() {
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
    const mobileViewSystemsBtn = document.getElementById('mobileViewSystemsBtn');
    const mobileViewIndividualsBtn = document.getElementById('mobileViewIndividualsBtn');
    const mobileCompareHospitalsBtn = document.getElementById('mobileCompareHospitalsBtn');
    const individualOptions = document.getElementById('individualOptions');
    const mobileIndividualOptions = document.getElementById('mobileIndividualOptions');

    if (viewSystemsBtn && mobileViewSystemsBtn) {
        mobileViewSystemsBtn.classList.toggle('active', viewSystemsBtn.classList.contains('active'));
        mobileViewIndividualsBtn.classList.toggle('active', viewIndividualsBtn.classList.contains('active'));
        mobileCompareHospitalsBtn.classList.toggle('active', compareHospitalsBtn.classList.contains('active'));
        
        if (mobileIndividualOptions) {
            mobileIndividualOptions.style.display = viewIndividualsBtn.classList.contains('active') ? 'block' : 'none';
        }
    }
}

function syncMobileFilterButtons() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');
    const mobileFilterCriticalBtn = document.getElementById('mobileFilterCriticalBtn');
    const mobileFilterAcuteBtn = document.getElementById('mobileFilterAcuteBtn');

    if (filterCriticalBtn && mobileFilterCriticalBtn) {
        mobileFilterCriticalBtn.classList.toggle('active', filterCriticalBtn.classList.contains('active'));
        mobileFilterAcuteBtn.classList.toggle('active', filterAcuteBtn.classList.contains('active'));
    }
}

function syncFilterInputs() {
    // Sync checkbox states
    const desktopCheckboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
    const mobileCheckboxes = document.querySelectorAll('.mobile-filter-content input[type="checkbox"]');
    
    desktopCheckboxes.forEach((checkbox, index) => {
        if (mobileCheckboxes[index]) {
            mobileCheckboxes[index].checked = checkbox.checked;
        }
    });

    // Sync input values
    const zipInput = document.getElementById('zipInput');
    const mobileZipInput = document.getElementById('mobileZipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    const mobileRadiusSelect = document.getElementById('mobileRadiusSelect');

    if (zipInput && mobileZipInput) mobileZipInput.value = zipInput.value;
    if (radiusSelect && mobileRadiusSelect) mobileRadiusSelect.value = radiusSelect.value;
}

// ===============================
// Map Functions
// ===============================

function initHospitalMap(data) {
    const mapDiv = document.getElementById('mainMap');
    if (!mapDiv) {
        console.error('Main map container not found!');
        return;
    }

    if (!map) {
        console.log('Initializing main map...');
        map = L.map('mainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
    }

    updateMapMarkers(data);
}

function initMobileMap(data) {
    const mapDiv = document.getElementById('mobileMainMap');
    if (!mapDiv) return;

    if (!mobileMap) {
        mobileMap = L.map('mobileMainMap').setView([32.7, -83.4], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(mobileMap);
    }

    updateMobileMapMarkers(data);
}

function updateMapMarkers(data) {
    // Clear old markers
    mapMarkers.forEach(marker => map.removeLayer(marker));
    mapMarkers = [];

    if (data.length === 0) return;

    // Add new markers
    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        // Fallback to ZIP coordinates
        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }

        if (!lat || !lon) return;

        const hospitalName = getHospitalName(hospital);
        const hospitalId = getHospitalId(hospital);
        const grade = getHospitalGrade(hospital) || 'N/A';
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <div class="map-popup">
                <strong>${hospitalName}</strong><br>
                ${hospital.City || ''}, ${hospital.State || ''}<br>
                <div class="star-rating">${renderStars(stars.value)}</div>
                <a href="details.html?id=${hospitalId}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
        mapMarkers.push(marker);
    });

    // Adjust map bounds
    if (mapMarkers.length > 0) {
        const group = L.featureGroup(mapMarkers);
        map.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => map.invalidateSize(), 100);
}

function updateMobileMapMarkers(data) {
    if (!mobileMap) return;
    
    mobileMapMarkers.forEach(marker => mobileMap.removeLayer(marker));
    mobileMapMarkers = [];

    if (data.length === 0) return;

    data.forEach(hospital => {
        let lat = parseFloat(hospital.Latitude);
        let lon = parseFloat(hospital.Longitude);

        if ((!lat || !lon) && hospital.Zip) {
            [lat, lon] = getZipCoords(hospital.Zip);
        }

        if (!lat || !lon) return;

        const hospitalName = getHospitalName(hospital);
        const hospitalId = getHospitalId(hospital);
        const grade = getHospitalGrade(hospital) || 'N/A';
        const stars = convertGradeToStars(grade);

        const popupHTML = `
            <div class="map-popup">
                <strong>${hospitalName}</strong><br>
                ${hospital.City || ''}, ${hospital.State || ''}<br>
                <div class="star-rating">${renderStars(stars.value)}</div>
                <a href="details.html?id=${hospitalId}" class="view-full-detail">
                    View Full Details
                </a>
            </div>
        `;

        const marker = L.marker([lat, lon]).addTo(mobileMap).bindPopup(popupHTML);
        mobileMapMarkers.push(marker);
    });

    if (mobileMapMarkers.length > 0) {
        const group = L.featureGroup(mobileMapMarkers);
        mobileMap.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => mobileMap.invalidateSize(), 100);
}

// ===============================
// Filter Functions
// ===============================

function applyAllFilters() {
    let filtered = [...hospitalData];

    // Apply hospital type filters
    const selectedHospitalType = getSelectedHospitalType();
    if (selectedHospitalType === 'Critical Access') {
        filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_CAH === 1 || hospital["Critical Access"] === 1);
    } else if (selectedHospitalType === 'Acute Care') {
        filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_ACH === 1 || hospital["Acute Care"] === 1);
    }

    // Apply checkbox filters
    const checked = [...document.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    
    if (checked.length > 0) {
        filtered = filtered.filter(hospital => {
            return checked.every(val => {
                switch(val) {
                    case 'Urban': return hospital.TYPE_urban === 1 || hospital.Urban === 1;
                    case 'Rural': return hospital.TYPE_rural === 1 || hospital.Rural === 1;
                    case 'Non-profit': return hospital.TYPE_NonProfit === 1 || hospital.Nonprofit === 1;
                    case 'For Profit': return hospital.TYPE_ForProfit === 1 || hospital["For Profit"] === 1;
                    case 'Church Affiliated': return hospital.TYPE_chrch_affl_f === 1 || hospital["Church Affiliated"] === 1;
                    case 'Academic Medical Center': return hospital.TYPE_AMC === 1 || hospital["Academic Medical Center"] === 1;
                    case 'Safety Net': return hospital.TYPE_isSafetyNet === 1 || hospital["Safety Net"] === 1;
                    default: return JSON.stringify(hospital).toLowerCase().includes(val.toLowerCase());
                }
            });
        });
    }

    // Apply location filter
    const zip = document.getElementById('zipInput')?.value.trim();
    const radius = document.getElementById('radiusSelect')?.value;

    if (zip && /^\d{5}$/.test(zip)) {
        const coords = getZipCoords(zip);
        filtered = filtered.filter(hospital => {
            let lat = parseFloat(hospital.Latitude) || getZipCoords(hospital.Zip)[0];
            let lon = parseFloat(hospital.Longitude) || getZipCoords(hospital.Zip)[1];
            const distance = calculateDistance(coords[0], coords[1], lat, lon);
            return distance <= parseInt(radius);
        });
    }

    filteredHospitalData = filtered;
    sortAndRender(filteredHospitalData);
}

function getSelectedHospitalType() {
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');
    
    if (filterCriticalBtn?.classList.contains('active')) return 'Critical Access';
    if (filterAcuteBtn?.classList.contains('active')) return 'Acute Care';
    return null;
}

function resetAllFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    const zipInput = document.getElementById('zipInput');
    const radiusSelect = document.getElementById('radiusSelect');
    
    if (zipInput) zipInput.value = '';
    if (radiusSelect) radiusSelect.selectedIndex = 0;

    deactivateAllViewButtons();
    deactivateHospitalTypeButtons();

    filteredHospitalData = [...hospitalData];
    renderHospitals(hospitalData);
    updateMapMarkers(hospitalData);
    updateMobileMapMarkers(hospitalData);
}

function deactivateAllViewButtons() {
    ['viewSystemsBtn', 'viewIndividualsBtn', 'compareHospitalsBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
}

function deactivateHospitalTypeButtons() {
    ['filterCriticalBtn', 'filterAcuteBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.remove('active');
    });
}

// ===============================
// Sorting Function
// ===============================

function sortAndRender(data) {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;

    const sortValue = sortSelect.value;
    let sorted = [...data];

    if (sortValue === 'grade') {
        sorted.sort((a, b) => {
            const gradeOrder = {
                'A+': 12, 'A': 11, 'A-': 10, 'B+': 9, 'B': 8, 'B-': 7, 
                'C+': 6, 'C': 5, 'C-': 4, 'D+': 3, 'D': 2, 'D-': 1, 'F': 0, 'N/A': -1
            };
            const gradeA = getHospitalGrade(a) || 'N/A';
            const gradeB = getHospitalGrade(b) || 'N/A';
            return gradeOrder[gradeB] - gradeOrder[gradeA];
        });
    } else if (sortValue === 'name') {
        sorted.sort((a, b) => getHospitalName(a).localeCompare(getHospitalName(b)));
    } else if (sortValue === 'size') {
        const sizeOrder = {'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5};
        sorted.sort((a, b) => {
            const sizeA = sizeOrder[a.Size] || 0;
            const sizeB = sizeOrder[b.Size] || 0;
            return sizeA - sizeB;
        });
    }

    renderHospitals(sorted);
}

// ===============================
// Utility Functions
// ===============================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getZipCoords(zip) {
    const lookup = {
        '30303': [33.7525, -84.3915], '30606': [33.9597, -83.3764],
        '31404': [32.0760, -81.0886], '31201': [32.8306, -83.6513],
        '31901': [32.464, -84.9877], '31701': [31.5795, -84.1557],
        '30501': [34.2963, -83.8255], '30161': [34.2546, -85.1647],
        '30720': [34.7698, -84.9719], '31520': [31.1499, -81.4915]
    };
    return lookup[String(zip)] || [32.5, -83.5];
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
    return `<svg class="star full" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>`;
}

function halfStarSVG() {
    return `<svg class="star half" viewBox="0 0 24 24"><defs><linearGradient id="halfGradient"><stop offset="50%" stop-color="#f48810"/><stop offset="50%" stop-color="#a4cc95"/></linearGradient></defs><path fill="url(#halfGradient)" d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>`;
}

function emptyStarSVG() {
    return `<svg class="star empty" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.431L24 9.748l-6 5.848 1.416 8.26L12 19.896l-7.416 3.96L6 15.596 0 9.748l8.332-1.73z"/></svg>`;
}

// ===============================
// UI Utilities
// ===============================

function showMainLoading() {
    console.log("Loading hospital data...");
}

function hideMainLoading() {
    console.log("Hospital data loaded");
}

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.innerHTML = `<p>${message}</p>`;
    document.body.appendChild(popup);
    
    setTimeout(() => popup.classList.add('visible'), 10);
    setTimeout(() => {
        popup.classList.remove('visible');
        setTimeout(() => popup.remove(), 400);
    }, 4000);
}

// ===============================
// Event Listeners Setup
// ===============================

function setupEventListeners() {
    // View toggle buttons
    const viewSystemsBtn = document.getElementById('viewSystemsBtn');
    const viewIndividualsBtn = document.getElementById('viewIndividualsBtn');
    const compareHospitalsBtn = document.getElementById('compareHospitalsBtn');
    const filterCriticalBtn = document.getElementById('filterCriticalBtn');
    const filterAcuteBtn = document.getElementById('filterAcuteBtn');

    viewSystemsBtn?.addEventListener('click', () => {
        deactivateAllViewButtons();
        viewSystemsBtn.classList.add('active');
        document.getElementById('individualOptions').style.display = 'none';
        applyAllFilters();
    });

    viewIndividualsBtn?.addEventListener('click', () => {
        deactivateAllViewButtons();
        viewIndividualsBtn.classList.add('active');
        document.getElementById('individualOptions').style.display = 'block';
        applyAllFilters();
    });

    compareHospitalsBtn?.addEventListener('click', () => {
        deactivateAllViewButtons();
        compareHospitalsBtn.classList.add('active');
        document.getElementById('individualOptions').style.display = 'none';
        window.location.href = 'compare.html';
    });

    filterCriticalBtn?.addEventListener('click', () => {
        const isActive = filterCriticalBtn.classList.contains('active');
        deactivateHospitalTypeButtons();
        if (!isActive) filterCriticalBtn.classList.add('active');
        applyAllFilters();
    });

    filterAcuteBtn?.addEventListener('click', () => {
        const isActive = filterAcuteBtn.classList.contains('active');
        deactivateHospitalTypeButtons();
        if (!isActive) filterAcuteBtn.classList.add('active');
        applyAllFilters();
    });

    // Filter buttons
    document.getElementById('applyLocationBtn')?.addEventListener('click', applyAllFilters);
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyAllFilters);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetAllFilters);

    // Sort select
    document.getElementById('sortSelect')?.addEventListener('change', () => {
        sortAndRender(filteredHospitalData);
    });

    // Download button
    document.getElementById('downloadDataBtn')?.addEventListener('click', () => {
        console.log('Download triggered');
    });
}
