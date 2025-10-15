// ===============================
// Global Variables
// ===============================

let hospitalData = [];
let filteredData = [];
let map;
let markers = [];
let currentView = 'systems'; // 'systems' or 'individuals'
let currentHospitalType = 'all'; // 'all', 'critical', 'acute'
let activeFilters = {
    hospitalType: [],
    metrics: []
};
let userLocation = null;
let searchRadius = 10;

// ===============================
// DOM Content Loaded
// ===============================

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

// ===============================
// Initialize Application
// ===============================

async function initializeApp() {
    try {
        showLoadingState();
        
        // Load hospital data
        await loadHospitalData();
        
        // Initialize map
        initializeMap();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial data display
        applyFilters();
        
        hideLoadingState();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load hospital data. Please refresh the page.');
    }
}

// ===============================
// Data Loading - UPDATED FOR YOUR DATA STRUCTURE
// ===============================

async function loadHospitalData() {
    try {
        console.log('Loading hospital data...');
        
        // Try to load from local JSON file
        const response = await fetch('data/2025/2025_Lown_Index_GA.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw data loaded:', data);
        
        // Process the data with YOUR specific field names
        hospitalData = processHospitalData(data);
        console.log('Processed hospital data:', hospitalData);
        
    } catch (error) {
        console.error('Error loading hospital data:', error);
        
        // Fallback to hardcoded sample data if file loading fails
        hospitalData = getSampleData();
        console.log('Using sample data:', hospitalData);
    }
}

// ===============================
// DATA PROCESSING - UPDATED FOR YOUR FIELD NAMES
// ===============================

function processHospitalData(rawData) {
    if (!rawData || !Array.isArray(rawData)) {
        console.warn('Invalid data format, using sample data');
        return getSampleData();
    }
    
    return rawData.map(hospital => ({
        // Core identification
        id: hospital.RECORD_ID || generateId(),
        name: hospital.Name || 'Unknown Hospital',
        system: hospital.SYSTEM_NAME || 'Independent',
        
        // Hospital type classification - USING YOUR ACTUAL FIELD NAMES
        TYPE_HospTyp_CAH: hospital.TYPE_HospTyp_CAH || 0,
        TYPE_HospTyp_ACH: hospital.TYPE_HospTyp_ACH || 0,
        TYPE_AMC: hospital.TYPE_AMC || 0,
        TYPE_NonProfit: hospital.TYPE_NonProfit || 0,
        TYPE_ForProfit: hospital.TYPE_ForProfit || 0,
        TYPE_chrch_affl_f: hospital.TYPE_chrch_affl_f || 0,
        TYPE_isSafetyNet: hospital.TYPE_isSafetyNet || 0,
        TYPE_urban: hospital.TYPE_urban || 0,
        TYPE_rural: hospital.TYPE_rural || 0,
        
        // Location data
        latitude: hospital.Latitude || null,
        longitude: hospital.Longitude || null,
        address: hospital.Address || '',
        city: hospital.City || '',
        state: hospital.State || 'GA',
        zip: hospital.Zip || '',
        county: hospital.County || '',
        
        // Size and capacity
        beds: hospital.beds || 0,
        Size: hospital.Size || 'm', // xs, s, m, l, xl
        
        // Grades - USING YOUR ACTUAL GRADE FIELD NAMES
        overall_grade: hospital.TIER_1_GRADE_Lown_Composite || 'N/A',
        TIER_2_GRADE_Value: hospital.TIER_2_GRADE_Value || 'N/A',
        TIER_3_GRADE_CB: hospital.TIER_3_GRADE_CB || 'N/A',
        TIER_3_GRADE_Cost_Eff: hospital.TIER_3_GRADE_Cost_Eff || 'N/A',
        TIER_3_GRADE_Inclusivity: hospital.TIER_3_GRADE_Inclusivity || 'N/A',
        TIER_2_GRADE_Outcome: hospital.TIER_2_GRADE_Outcome || 'N/A',
        TIER_3_GRADE_Pat_Saf: hospital.TIER_3_GRADE_Pat_Saf || 'N/A',
        TIER_3_GRADE_Pat_Exp: hospital.TIER_3_GRADE_Pat_Exp || 'N/A',
        
        // Services
        services: parseServices(hospital.SERVICES),
        
        // Calculated fields for display
        distance: hospital.distance || null,
        display_type: getHospitalTypeDisplay(hospital),
        display_urban_rural: getUrbanRuralDisplay(hospital)
    }));
}

// Helper function to determine hospital type for display
function getHospitalTypeDisplay(hospital) {
    const types = [];
    
    if (hospital.TYPE_HospTyp_CAH === 1) types.push('Critical Access');
    if (hospital.TYPE_HospTyp_ACH === 1) types.push('Acute Care');
    if (hospital.TYPE_AMC === 1) types.push('Academic Medical Center');
    if (hospital.TYPE_NonProfit === 1) types.push('Non-profit');
    if (hospital.TYPE_ForProfit === 1) types.push('For Profit');
    if (hospital.TYPE_chrch_affl_f === 1) types.push('Church Affiliated');
    if (hospital.TYPE_isSafetyNet === 1) types.push('Safety Net');
    
    return types.length > 0 ? types.join(', ') : 'General Hospital';
}

// Helper function for urban/rural display
function getUrbanRuralDisplay(hospital) {
    if (hospital.TYPE_urban === 1) return 'Urban';
    if (hospital.TYPE_rural === 1) return 'Rural';
    return 'Unknown';
}

// Helper function to parse services
function parseServices(servicesData) {
    if (!servicesData) return ['General Care'];
    if (Array.isArray(servicesData)) return servicesData;
    if (typeof servicesData === 'string') {
        return servicesData.split(',').map(s => s.trim()).filter(s => s);
    }
    return ['General Care'];
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// ===============================
// Sample Data (Fallback) - UPDATED
// ===============================

function getSampleData() {
    return [
        {
            id: '1',
            name: 'Atlanta Medical Center',
            system: 'Wellstar Health System',
            TYPE_HospTyp_ACH: 1,
            TYPE_AMC: 1,
            TYPE_NonProfit: 1,
            TYPE_urban: 1,
            latitude: 33.7488,
            longitude: -84.3877,
            address: '303 Parkway Dr NE',
            city: 'Atlanta',
            state: 'GA',
            zip: '30312',
            county: 'Fulton',
            beds: 460,
            Size: 'xl',
            overall_grade: 'B+',
            TIER_2_GRADE_Value: 'B',
            TIER_3_GRADE_CB: 'C+',
            TIER_3_GRADE_Cost_Eff: 'B',
            TIER_3_GRADE_Inclusivity: 'B-',
            services: ['Emergency', 'Surgery', 'Cardiology', 'Oncology'],
            display_type: 'Acute Care, Academic Medical Center, Non-profit',
            display_urban_rural: 'Urban',
            distance: null
        },
        {
            id: '2',
            name: 'Piedmont Athens Regional',
            system: 'Piedmont Healthcare',
            TYPE_HospTyp_ACH: 1,
            TYPE_NonProfit: 1,
            TYPE_urban: 1,
            latitude: 33.9597,
            longitude: -83.3764,
            address: '1199 Prince Ave',
            city: 'Athens',
            state: 'GA',
            zip: '30606',
            county: 'Clarke',
            beds: 360,
            Size: 'l',
            overall_grade: 'A-',
            TIER_2_GRADE_Value: 'A',
            TIER_3_GRADE_CB: 'B+',
            TIER_3_GRADE_Cost_Eff: 'A-',
            TIER_3_GRADE_Inclusivity: 'A',
            services: ['Emergency', 'Maternity', 'Pediatrics', 'Orthopedics'],
            display_type: 'Acute Care, Non-profit',
            display_urban_rural: 'Urban',
            distance: null
        }
    ];
}

// ===============================
// Map Initialization
// ===============================

function initializeMap() {
    // Default to Georgia center
    const defaultCenter = [32.1656, -82.9001]; // Central Georgia
    
    map = L.map('mainMap').setView(defaultCenter, 7);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    console.log('Map initialized');
}

// ===============================
// Event Listeners
// ===============================

function setupEventListeners() {
    // View toggle buttons
    document.getElementById('viewSystemsBtn').addEventListener('click', () => switchView('systems'));
    document.getElementById('viewIndividualsBtn').addEventListener('click', () => switchView('individuals'));
    
    // Individual hospital type filters
    document.getElementById('filterCriticalBtn').addEventListener('click', () => filterIndividualType('critical'));
    document.getElementById('filterAcuteBtn').addEventListener('click', () => filterIndividualType('acute'));
    
    // Location search
    document.getElementById('applyLocationBtn').addEventListener('click', applyLocationFilter);
    
    // Filter application
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
    
    // Data download
    document.getElementById('downloadDataBtn').addEventListener('click', downloadData);
    
    // Sort functionality
    document.getElementById('sortSelect').addEventListener('change', applySorting);
    
    // Real-time filter updates
    setupRealTimeFilters();
}

function setupRealTimeFilters() {
    // Hospital type checkboxes
    const typeCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    typeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
}

// ===============================
// View Management
// ===============================

function switchView(view) {
    currentView = view;
    
    // Update button states
    document.getElementById('viewSystemsBtn').classList.toggle('active', view === 'systems');
    document.getElementById('viewIndividualsBtn').classList.toggle('active', view === 'individuals');
    
    // Show/hide individual options
    const individualOptions = document.getElementById('individualOptions');
    individualOptions.style.display = view === 'individuals' ? 'block' : 'none';
    
    // Reset individual type filter when switching views
    if (view === 'systems') {
        currentHospitalType = 'all';
        document.getElementById('filterCriticalBtn').classList.remove('active');
        document.getElementById('filterAcuteBtn').classList.remove('active');
    }
    
    applyFilters();
}

function filterIndividualType(type) {
    if (currentHospitalType === type) {
        // Toggle off if same type clicked
        currentHospitalType = 'all';
    } else {
        currentHospitalType = type;
    }
    
    // Update button states
    document.getElementById('filterCriticalBtn').classList.toggle('active', currentHospitalType === 'critical');
    document.getElementById('filterAcuteBtn').classList.toggle('active', currentHospitalType === 'acute');
    
    applyFilters();
}

// ===============================
// Location Filtering
// ===============================

function applyLocationFilter() {
    const zipInput = document.getElementById('zipInput').value.trim();
    const radiusSelect = document.getElementById('radiusSelect');
    searchRadius = parseInt(radiusSelect.value);
    
    if (!zipInput) {
        alert('Please enter a ZIP code');
        return;
    }
    
    // In a real application, you would geocode the ZIP code here
    // For demo purposes, we'll use a mock geocoding function
    geocodeZipCode(zipInput).then(location => {
        if (location) {
            userLocation = location;
            calculateDistances();
            applyFilters();
            updateMapView();
        } else {
            alert('Could not find location for that ZIP code');
        }
    }).catch(error => {
        console.error('Geocoding error:', error);
        alert('Error finding location. Please try another ZIP code.');
    });
}

function geocodeZipCode(zipCode) {
    // Mock geocoding - in real app, use a service like OpenStreetMap Nominatim
    return new Promise((resolve) => {
        // Mock coordinates for common Georgia ZIP codes
        const zipCoordinates = {
            '30303': { lat: 33.7529, lng: -84.3903 }, // Atlanta
            '30606': { lat: 33.9597, lng: -83.3764 }, // Athens
            '31404': { lat: 32.0760, lng: -81.0886 }, // Savannah
            '31533': { lat: 31.5185, lng: -82.8499 }, // Douglas
            '30553': { lat: 34.3434, lng: -83.8003 }  // Lavonia
        };
        
        const coords = zipCoordinates[zipCode] || { lat: 33.7490, lng: -84.3880 }; // Default to Atlanta
        resolve(coords);
    });
}

function calculateDistances() {
    if (!userLocation) return;
    
    hospitalData.forEach(hospital => {
        if (hospital.latitude && hospital.longitude) {
            hospital.distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                hospital.latitude, hospital.longitude
            );
        } else {
            hospital.distance = null;
        }
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate distance between two coordinates
    const R = 3959; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ===============================
// Filter Application - UPDATED FOR YOUR DATA FIELDS
// ===============================

function applyFilters() {
    console.log('Applying filters...');
    
    // Start with all data
    filteredData = [...hospitalData];
    
    // Apply view filter - UPDATED TO USE ACTUAL DATA FIELDS
    if (currentView === 'individuals' && currentHospitalType !== 'all') {
        filteredData = filteredData.filter(hospital => {
            if (currentHospitalType === 'critical') {
                return hospital.TYPE_HospTyp_CAH === 1;
            } else if (currentHospitalType === 'acute') {
                return hospital.TYPE_HospTyp_ACH === 1;
            }
            return true;
        });
    }
    
    // Apply hospital type filters - UPDATED TO USE ACTUAL DATA FIELDS
    const typeCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const selectedTypes = Array.from(typeCheckboxes).map(cb => cb.value);
    
    if (selectedTypes.length > 0) {
        filteredData = filteredData.filter(hospital => {
            return selectedTypes.some(type => {
                switch(type) {
                    case 'Urban': return hospital.TYPE_urban === 1;
                    case 'Rural': return hospital.TYPE_rural === 1;
                    case 'Non-profit': return hospital.TYPE_NonProfit === 1;
                    case 'For Profit': return hospital.TYPE_ForProfit === 1;
                    case 'Church Affiliated': return hospital.TYPE_chrch_affl_f === 1;
                    case 'Academic Medical Center': return hospital.TYPE_AMC === 1;
                    case 'Safety Net': return hospital.TYPE_isSafetyNet === 1;
                    default: return false;
                }
            });
        });
    }
    
    // Apply location filter
    if (userLocation) {
        filteredData = filteredData.filter(hospital => 
            hospital.distance !== null && hospital.distance <= searchRadius
        );
    }
    
    // Apply sorting
    applySorting();
    
    // Update UI
    updateResultsDisplay();
    updateMapMarkers();
    updateResultsCount();
    
    console.log('Filtered data:', filteredData);
}

function applySorting() {
    const sortSelect = document.getElementById('sortSelect');
    const sortValue = sortSelect.value;
    
    filteredData.sort((a, b) => {
        switch (sortValue) {
            case 'grade':
                return compareGrades(b.overall_grade, a.overall_grade);
            case 'distance':
                return (a.distance || Infinity) - (b.distance || Infinity);
            case 'name':
                return a.name.localeCompare(b.name);
            case 'size':
                return compareSizes(a.Size, b.Size);
            default:
                return 0;
        }
    });
}

function compareGrades(gradeA, gradeB) {
    const gradeOrder = { 
        'A+': 12, 'A': 11, 'A-': 10, 
        'B+': 9, 'B': 8, 'B-': 7, 
        'C+': 6, 'C': 5, 'C-': 4, 
        'D+': 3, 'D': 2, 'D-': 1, 
        'F': 0, 'N/A': -1 
    };
    return (gradeOrder[gradeA] || 0) - (gradeOrder[gradeB] || 0);
}

function compareSizes(sizeA, sizeB) {
    const sizeOrder = { 'xs': 1, 's': 2, 'm': 3, 'l': 4, 'xl': 5 };
    return (sizeOrder[sizeA] || 0) - (sizeOrder[sizeB] || 0);
}

// ===============================
// UI Updates
// ===============================

function updateResultsDisplay() {
    const resultsContainer = document.getElementById('hospitalResults');
    
    if (filteredData.length === 0) {
        resultsContainer.innerHTML = `
            <tr>
                <td colspan="3" class="no-results">
                    <h3>No hospitals match your criteria</h3>
                    <p>Try adjusting your filters or search location</p>
                </td>
            </tr>
        `;
        return;
    }
    
    resultsContainer.innerHTML = filteredData.map(hospital => `
        <tr class="hospital-row" data-hospital-id="${hospital.id}">
            <td>
                <div class="score-display">
                    <div class="star-rating">
                        ${generateStars(hospital.overall_grade)}
                    </div>
                    <span class="score-value">${hospital.overall_grade}</span>
                </div>
            </td>
            <td>
                <div class="hospital-name">${hospital.name}</div>
                <div class="hospital-location">${hospital.city}, ${hospital.county} County</div>
                <div class="hospital-type">${hospital.display_type} • ${hospital.display_urban_rural}</div>
                ${hospital.distance ? `<div class="hospital-distance">${hospital.distance.toFixed(1)} miles away</div>` : ''}
            </td>
            <td>
                <div class="details-buttons">
                    <button class="toggle-detail" onclick="toggleHospitalDetail('${hospital.id}')">
                        View Details
                    </button>
                    <button class="view-full-detail" onclick="viewFullDetail('${hospital.id}')">
                        Full Profile
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateStars(grade) {
    const gradeToStars = {
        'A+': 5, 'A': 5, 'A-': 4.5,
        'B+': 4, 'B': 3.5, 'B-': 3,
        'C+': 2.5, 'C': 2, 'C-': 1.5,
        'D+': 1, 'D': 0.5, 'D-': 0.5,
        'F': 0, 'N/A': 0
    };
    
    const starCount = gradeToStars[grade] || 0;
    let starsHTML = '';
    
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

function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Add new markers
    filteredData.forEach(hospital => {
        if (hospital.latitude && hospital.longitude) {
            const marker = L.marker([hospital.latitude, hospital.longitude])
                .addTo(map)
                .bindPopup(`
                    <div class="map-popup">
                        <h3>${hospital.name}</h3>
                        <p><strong>Grade:</strong> ${hospital.overall_grade}</p>
                        <p><strong>Type:</strong> ${hospital.display_type}</p>
                        <p><strong>Beds:</strong> ${hospital.beds}</p>
                        ${hospital.distance ? `<p><strong>Distance:</strong> ${hospital.distance.toFixed(1)} miles</p>` : ''}
                        <button onclick="viewFullDetail('${hospital.id}')" class="map-detail-btn">
                            View Details
                        </button>
                    </div>
                `);
            markers.push(marker);
        }
    });
    
    // Adjust map view to show all markers if there are any
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

function updateMapView() {
    if (userLocation && markers.length > 0) {
        // Center map on user location but ensure all markers are visible
        const group = new L.featureGroup(markers);
        const bounds = group.getBounds();
        
        // Include user location in bounds
        bounds.extend([userLocation.lat, userLocation.lng]);
        
        map.fitBounds(bounds.pad(0.1));
    } else if (userLocation) {
        // Just center on user location if no markers
        map.setView([userLocation.lat, userLocation.lng], 10);
    }
}

function updateResultsCount() {
    const countElement = document.getElementById('resultsCount');
    countElement.textContent = `Viewing ${filteredData.length} ${filteredData.length === 1 ? 'result' : 'results'}`;
}

// ===============================
// Detail Management
// ===============================

function toggleHospitalDetail(hospitalId) {
    const hospital = hospitalData.find(h => h.id === hospitalId);
    if (!hospital) return;
    
    const row = document.querySelector(`[data-hospital-id="${hospitalId}"]`);
    const existingDetail = row.nextElementSibling;
    
    if (existingDetail && existingDetail.classList.contains('hospital-detail-row')) {
        // Remove existing detail
        existingDetail.remove();
    } else {
        // Remove any other open details
        document.querySelectorAll('.hospital-detail-row').forEach(detail => detail.remove());
        
        // Add new detail row
        const detailRow = document.createElement('tr');
        detailRow.className = 'hospital-detail-row';
        detailRow.innerHTML = `
            <td colspan="3">
                <div class="detail-info">
                    <h4>${hospital.name} - Detailed Information</h4>
                    <div class="detail-grid">
                        <div class="detail-column">
                            <h5>Location & Contact</h5>
                            <p><strong>Address:</strong> ${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.zip}</p>
                            <p><strong>County:</strong> ${hospital.county}</p>
                            <p><strong>System:</strong> ${hospital.system}</p>
                        </div>
                        <div class="detail-column">
                            <h5>Metrics</h5>
                            <p><strong>Overall Grade:</strong> ${hospital.overall_grade}</p>
                            <p><strong>Value Grade:</strong> ${hospital.TIER_2_GRADE_Value}</p>
                            <p><strong>Community Benefit:</strong> ${hospital.TIER_3_GRADE_CB}</p>
                            <p><strong>Cost Effectiveness:</strong> ${hospital.TIER_3_GRADE_Cost_Eff}</p>
                            <p><strong>Inclusivity:</strong> ${hospital.TIER_3_GRADE_Inclusivity}</p>
                        </div>
                        <div class="detail-column">
                            <h5>Services</h5>
                            <ul>
                                ${hospital.services.map(service => `<li>${service}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="detail-actions">
                        <button class="view-full-detail" onclick="viewFullDetail('${hospital.id}')">
                            View Full Profile Page
                        </button>
                    </div>
                </div>
            </td>
        `;
        
        row.parentNode.insertBefore(detailRow, row.nextSibling);
    }
}

function viewFullDetail(hospitalId) {
    // Navigate to details page with hospital ID
    window.location.href = `details.html?id=${hospitalId}`;
}

// ===============================
// Filter Management
// ===============================

function resetFilters() {
    // Reset view
    currentView = 'systems';
    currentHospitalType = 'all';
    
    // Reset UI elements
    document.getElementById('viewSystemsBtn').classList.add('active');
    document.getElementById('viewIndividualsBtn').classList.remove('active');
    document.getElementById('individualOptions').style.display = 'none';
    document.getElementById('filterCriticalBtn').classList.remove('active');
    document.getElementById('filterAcuteBtn').classList.remove('active');
    
    // Reset checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset location
    document.getElementById('zipInput').value = '';
    userLocation = null;
    
    // Reset sort
    document.getElementById('sortSelect').value = 'grade';
    
    // Reapply filters
    applyFilters();
}

// ===============================
// Data Export
// ===============================

function downloadData() {
    if (filteredData.length === 0) {
        alert('No data to download');
        return;
    }
    
    // Convert to CSV
    const headers = ['Name', 'System', 'Type', 'Location', 'Beds', 'Overall Grade', 'Value Grade', 'Community Benefit', 'Cost Effectiveness', 'Inclusivity'];
    const csvData = filteredData.map(hospital => [
        hospital.name,
        hospital.system,
        hospital.display_type,
        `${hospital.city}, ${hospital.county} County`,
        hospital.beds,
        hospital.overall_grade,
        hospital.TIER_2_GRADE_Value,
        hospital.TIER_3_GRADE_CB,
        hospital.TIER_3_GRADE_Cost_Eff,
        hospital.TIER_3_GRADE_Inclusivity
    ]);
    
    const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `georgia-hospitals-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===============================
// Utility Functions
// ===============================

function showLoadingState() {
    // Add loading indicator to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.textContent.includes('Apply') || btn.textContent.includes('Download')) {
            btn.disabled = true;
            btn.innerHTML = `<span class="loading-spinner"></span>Loading...`;
        }
    });
}

function hideLoadingState() {
    // Remove loading indicator
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.innerHTML.includes('loading-spinner')) {
            btn.disabled = false;
            btn.textContent = btn.textContent.replace('Loading...', '').trim();
        }
    });
}

function showError(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${message}
        <button onclick="this.parentElement.remove()" style="margin-left: 10px;">×</button>
    `;
    
    // Insert at top of content area
    const contentArea = document.querySelector('.content-area');
    contentArea.insertBefore(errorDiv, contentArea.firstChild);
}

// ===============================
// Make functions globally available
// ===============================

window.toggleHospitalDetail = toggleHospitalDetail;
window.viewFullDetail = viewFullDetail;
