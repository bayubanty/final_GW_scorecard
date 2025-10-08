// ===============================
// Data Storage and State
// ===============================
let hospitalData = [];
let filteredHospitalData = [];
let currentView = 'individuals'; // 'systems' or 'individuals'
let currentHospitalType = null; // 'Critical Access' or 'Acute Care'
let map;
let mapMarkers = [];

// ===============================
// Load JSON Data
// ===============================
fetch("./data/2025/2025_Lown_Index_GA.json")
  .then(res => res.json())
  .then(data => {
    hospitalData = data;
    filteredHospitalData = [...hospitalData];
    console.log("Hospital data loaded:", hospitalData.length, "records");

    // Initial render
    renderHospitals(filteredHospitalData);
    initHospitalMap(filteredHospitalData);
    
    // Set up event listeners
    setupEventListeners();
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    // Fallback: show error in results
    document.getElementById("hospitalResults").innerHTML = 
      '<tr><td colspan="3">Error loading hospital data. Please try again later.</td></tr>';
  });

// ===============================
// Setup Event Listeners
// ===============================
function setupEventListeners() {
  // View Toggle
  document.getElementById("viewSystemsBtn").addEventListener("click", () => {
    setViewMode('systems');
  });
  
  document.getElementById("viewIndividualsBtn").addEventListener("click", () => {
    setViewMode('individuals');
  });

  // Hospital Type Filter
  document.getElementById("filterCriticalBtn").addEventListener("click", () => {
    toggleHospitalType('Critical Access');
  });
  
  document.getElementById("filterAcuteBtn").addEventListener("click", () => {
    toggleHospitalType('Acute Care');
  });

  // Location Search
  document.getElementById("applyLocationBtn").addEventListener("click", applyLocationFilter);

  // Sort Functionality
  document.getElementById("sortSelect").addEventListener("change", applySorting);

  // Filter Actions
  document.getElementById("applyFiltersBtn").addEventListener("click", applyAllFilters);
  document.getElementById("resetFiltersBtn").addEventListener("click", resetAllFilters);
  document.getElementById("downloadDataBtn").addEventListener("click", downloadData);

  // Enter key for ZIP code
  document.getElementById("zipInput").addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
      applyLocationFilter();
    }
  });
}

// ===============================
// View Mode Logic
// ===============================
function setViewMode(mode) {
  currentView = mode;
  
  const systemsBtn = document.getElementById("viewSystemsBtn");
  const individualsBtn = document.getElementById("viewIndividualsBtn");
  const individualOptions = document.getElementById("individualOptions");

  if (mode === 'systems') {
    systemsBtn.classList.add("active");
    individualsBtn.classList.remove("active");
    individualOptions.style.display = "none";
  } else {
    systemsBtn.classList.remove("active");
    individualsBtn.classList.add("active");
    individualOptions.style.display = "block";
  }

  applyAllFilters();
}

// ===============================
// Hospital Type Filter Logic
// ===============================
function toggleHospitalType(type) {
  const criticalBtn = document.getElementById("filterCriticalBtn");
  const acuteBtn = document.getElementById("filterAcuteBtn");

  if (currentHospitalType === type) {
    // Toggle off
    currentHospitalType = null;
    criticalBtn.classList.remove("active");
    acuteBtn.classList.remove("active");
  } else {
    // Toggle on
    currentHospitalType = type;
    criticalBtn.classList.remove("active");
    acuteBtn.classList.remove("active");
    
    if (type === 'Critical Access') {
      criticalBtn.classList.add("active");
    } else {
      acuteBtn.classList.add("active");
    }
  }

  applyAllFilters();
}

// ===============================
// Location Filter Logic
// ===============================
function applyLocationFilter() {
  const zip = document.getElementById("zipInput").value.trim();
  const radius = parseInt(document.getElementById("radiusSelect").value);

  if (!zip) {
    // If no ZIP, clear distance calculations
    filteredHospitalData.forEach(hospital => {
      delete hospital.distance;
    });
    applyAllFilters();
    return;
  }

  // Validate ZIP code
  if (!/^\d{5}$/.test(zip)) {
    showErrorPopup("Please enter a valid 5-digit ZIP code");
    return;
  }

  console.log(`Applying location filter: ZIP ${zip}, radius ${radius} miles`);
  
  // Simulate distance calculation for demo
  // In production, you would use a geocoding service here
  const filtered = hospitalData.filter(hospital => {
    // Generate random distance for demo (0-50 miles)
    const randomDistance = Math.random() * 50;
    hospital.distance = randomDistance;
    return randomDistance <= radius;
  });

  filteredHospitalData = filtered;
  applySorting();
}

// ===============================
// Checkbox Filter Logic
// ===============================
function getSelectedFilters() {
  const filters = {
    hospitalTypes: [],
    metricCategories: []
  };

  // Get hospital type filters
  document.querySelectorAll('details:first-of-type input[type="checkbox"]:checked').forEach(checkbox => {
    filters.hospitalTypes.push(checkbox.value);
  });

  // Get metric category filters
  document.querySelectorAll('details:last-of-type input[type="checkbox"]:checked').forEach(checkbox => {
    filters.metricCategories.push(checkbox.value);
  });

  return filters;
}

// ===============================
// Main Filter Logic
// ===============================
function applyAllFilters() {
  let filtered = [...hospitalData];
  const filters = getSelectedFilters();

  // Apply view mode filter
  if (currentView === 'systems') {
    filtered = filtered.filter(hospital => hospital.HOSPITAL_SYSTEM === 1);
  }

  // Apply hospital type filter
  if (currentHospitalType === 'Critical Access') {
    filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_CAH === 1);
  } else if (currentHospitalType === 'Acute Care') {
    filtered = filtered.filter(hospital => hospital.TYPE_HospTyp_ACH === 1);
  }

  // Apply hospital type checkbox filters
  if (filters.hospitalTypes.length > 0) {
    filtered = filtered.filter(hospital => {
      return filters.hospitalTypes.some(filter => {
        switch(filter) {
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

  // Apply metric category filters
  if (filters.metricCategories.length > 0) {
    filtered = filtered.filter(hospital => {
      return filters.metricCategories.some(category => {
        return hasMetricData(hospital, category);
      });
    });
  }

  filteredHospitalData = filtered;
  applySorting();
}

function hasMetricData(hospital, category) {
  // Map category names to actual data fields in your JSON
  const categoryMap = {
    'Financial Transparency and Institutional Health': [
      'TIER_2_GRADE_Value', 'Financial_Transparency'
    ],
    'Community Benefit Spending': [
      'TIER_3_GRADE_CB', 'Community_Benefit'
    ],
    'Healthcare Affordability and Billing': [
      'TIER_3_GRADE_Cost_Eff', 'Affordability'
    ],
    'Healthcare Access and Social Responsibility': [
      'TIER_3_GRADE_Inclusivity', 'Access_Care'
    ]
  };

  const fields = categoryMap[category] || [];
  return fields.some(field => {
    const value = hospital[field];
    return value !== undefined && value !== null && value !== '' && value !== 'N/A';
  });
}

// ===============================
// Sorting Logic
// ===============================
function applySorting() {
  const sortValue = document.getElementById("sortSelect").value;
  let sorted = [...filteredHospitalData];

  switch(sortValue) {
    case "grade":
      sorted.sort((a, b) => {
        const gradeOrder = { 'A+': 12, 'A': 11, 'A-': 10, 'B+': 9, 'B': 8, 'B-': 7, 'C+': 6, 'C': 5, 'C-': 4, 'D+': 3, 'D': 2, 'D-': 1, 'F': 0 };
        const gradeA = a.TIER_1_GRADE_Lown_Composite || 'F';
        const gradeB = b.TIER_1_GRADE_Lown_Composite || 'F';
        return (gradeOrder[gradeB] || 0) - (gradeOrder[gradeA] || 0);
      });
      break;
      
    case "distance":
      sorted.sort((a, b) => {
        const distA = a.distance || Infinity;
        const distB = b.distance || Infinity;
        return distA - distB;
      });
      break;
      
    case "name":
      sorted.sort((a, b) => (a.Name || "").localeCompare(b.Name || ""));
      break;
      
    case "size":
      const sizeOrder = { 'xs': 0, 's': 1, 'm': 2, 'l': 3, 'xl': 4 };
      sorted.sort((a, b) => {
        const sizeA = sizeOrder[a.Size?.toLowerCase()] ?? -1;
        const sizeB = sizeOrder[b.Size?.toLowerCase()] ?? -1;
        return sizeA - sizeB;
      });
      break;
  }

  renderHospitals(sorted);
  initHospitalMap(sorted);
}

// ===============================
// Reset Logic
// ===============================
function resetAllFilters() {
  // Reset checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  // Reset location
  document.getElementById("zipInput").value = "";
  document.getElementById("radiusSelect").selectedIndex = 0;
  
  // Reset view mode
  setViewMode('individuals');
  
  // Reset hospital type
  currentHospitalType = null;
  document.getElementById("filterCriticalBtn").classList.remove("active");
  document.getElementById("filterAcuteBtn").classList.remove("active");
  
  // Reset sort
  document.getElementById("sortSelect").selectedIndex = 0;
  
  // Reset data
  filteredHospitalData = [...hospitalData];
  
  // Re-render
  renderHospitals(filteredHospitalData);
  initHospitalMap(filteredHospitalData);
  
  console.log("All filters reset");
  showErrorPopup("All filters have been reset");
}

// ===============================
// Download Logic
// ===============================
function downloadData() {
  if (filteredHospitalData.length === 0) {
    showErrorPopup("No data available to download");
    return;
  }

  console.log("Download triggered");
  
  // Convert data to CSV
  const csv = convertToCSV(filteredHospitalData);
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `georgia-hospitals-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  // Get all unique keys from all objects
  const headers = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => headers.add(key));
  });
  
  const headerArray = Array.from(headers);
  const csvRows = [headerArray.join(',')];
  
  data.forEach(row => {
    const values = headerArray.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '""';
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

// ===============================
// Render Hospitals (Your existing function with enhancements)
// ===============================
function renderHospitals(data) {
  const resultsTable = document.getElementById("hospitalResults");
  const resultsCount = document.getElementById("resultsCount");

  // Clear old results
  resultsTable.innerHTML = "";

  // Update results count
  const resultText = data.length === 1 ? "result" : "results";
  resultsCount.textContent = `Viewing ${data.length} ${resultText}`;

  if (!data.length) {
    resultsTable.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #666;">No hospitals match the selected filters. Try adjusting your criteria.</td></tr>`;
    return;
  }

  data.forEach(hospital => {
    // Convert letter grade to star rating
    const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const stars = convertGradeToStars(grade);

    // === Main Row ===
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
      ${hospital.City || ""}, ${hospital.State || ""}
      ${hospital.distance ? `<br><small class="distance">Distance: ${hospital.distance.toFixed(1)} miles</small>` : ''}
      ${hospital.Size ? `<br><small class="hospital-size">Size: ${hospital.Size}</small>` : ''}
    `;
    row.appendChild(nameCell);

    // === Buttons ===
    const buttonCell = document.createElement("td");
    buttonCell.classList.add("details-buttons");

    const detailsButton = document.createElement("button");
    detailsButton.textContent = "View Details ▼";
    detailsButton.classList.add("toggle-detail");

    const fullDetailsButton = document.createElement("button");
    fullDetailsButton.textContent = "View Full Details";
    fullDetailsButton.classList.add("view-full-detail");
    fullDetailsButton.addEventListener("click", () => {
      if (hospital.RECORD_ID) {
        window.location.href = `details.html?id=${hospital.RECORD_ID}`;
      } else {
        showErrorPopup("Sorry, we couldn't find more details for this hospital.");
      }
    });

    buttonCell.appendChild(detailsButton);
    buttonCell.appendChild(fullDetailsButton);
    row.appendChild(buttonCell);

    // === Detail Row (collapsed preview) ===
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

    // === Toggle Logic (single listener) ===
    detailsButton.addEventListener("click", () => {
      const isHidden = detailRow.style.display === "none" || detailRow.style.display === "";
      detailRow.style.display = isHidden ? "table-row" : "none";
      detailsButton.textContent = isHidden ? "Hide Details ▲" : "View Details ▼";
    });

    // === Append both rows ===
    resultsTable.appendChild(row);
    resultsTable.appendChild(detailRow);
  });
}

// ===============================
// Map Functions (Your existing functions)
// ===============================
function initHospitalMap(data) {
  const mapDiv = document.getElementById("mainMap");
  if (!mapDiv) return;

  // Initialize only once
  if (!map) {
    map = L.map("mainMap").setView([32.7, -83.4], 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
  }

  // Clear old markers
  mapMarkers.forEach(marker => map.removeLayer(marker));
  mapMarkers = [];

  // Add new markers
  data.forEach(hospital => {
    // Try all common latitude/longitude field names
    let lat =
      parseFloat(hospital.Latitude) ||
      parseFloat(hospital.LAT) ||
      parseFloat(hospital.lat) ||
      parseFloat(hospital.latitude);
    let lon =
      parseFloat(hospital.Longitude) ||
      parseFloat(hospital.LON) ||
      parseFloat(hospital.lon) ||
      parseFloat(hospital.longitude);

    // If no coordinates, approximate from ZIP code
    if ((!lat || !lon) && hospital.Zip) {
      [lat, lon] = getZipCoords(hospital.Zip);
    }
    if (!lat || !lon) return; // Skip entries missing coordinates

    const grade = hospital.TIER_1_GRADE_Lown_Composite || "N/A";
    const stars = convertGradeToStars(grade);

    const popupHTML = `
      <strong>${hospital.HOSPITAL_NAME || hospital.Name}</strong><br>
      ${hospital.CITY || ""}, ${hospital.STATE || ""}<br>
      <div class="star-rating">${renderStars(stars.value)}</div>
      <a href="details.html?id=${hospital.RECORD_ID}" target="_blank" class="view-full-detail">
        View Full Details
      </a>
    `;

    const marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHTML);
    mapMarkers.push(marker);
  });

  // Adjust map to fit all visible markers
  if (mapMarkers.length > 0) {
    const group = L.featureGroup(mapMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
  } else {
    // Reset to Georgia default if no markers
    map.setView([32.1656, -82.9001], 7);
  }
  
  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

function getZipCoords(zip) {
  const baseLat = 31.0;   // southern edge of Georgia
  const baseLon = -85.5;  // western edge of Georgia
  const zipNum = parseInt(String(zip).replace(/\D/g, "")) || 30000;

  // Spread zip codes somewhat evenly across the state
  const offsetLat = ((zipNum % 300) / 100) * 0.8; // 0–2.4° northward variation
  const offsetLon = ((zipNum % 700) / 100) * 0.8; // 0–2.4° eastward variation

  return [baseLat + offsetLat, baseLon + offsetLon];
}

// ===============================
// Star Rating Utilities (Your existing functions)
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
// Error Popup Utility
// ===============================
function showErrorPopup(message) {
  // Remove existing popup if any
  const existingPopup = document.querySelector('.error-popup');
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "error-popup";
  popup.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(popup);

  // Animate fade-in
  setTimeout(() => popup.classList.add("visible"), 10);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    popup.classList.remove("visible");
    setTimeout(() => {
      if (popup.parentNode) popup.remove();
    }, 400);
  }, 4000);
}
