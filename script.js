/* ============================================
   DRIVEFLEET — Online Vehicle Rental System
   Application Logic & Data Management
   ============================================ */

// ══════════════════════════════════════
// ═══ DATA LAYER ═══
// ══════════════════════════════════════

const DEFAULT_VEHICLES = [
  {
    id: "V001",
    name: "Toyota Fortuner",
    type: "SUV",
    rentPerDay: 3500,
    image: "assets/fortuner.png",
    seats: 7,
    fuel: "Diesel",
    transmission: "Automatic",
    available: true
  },
  {
    id: "V002",
    name: "Honda City",
    type: "Sedan",
    rentPerDay: 2000,
    image: "assets/city.png",
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    available: true
  },
  {
    id: "V003",
    name: "Hyundai i20",
    type: "Hatchback",
    rentPerDay: 1200,
    image: "assets/i20.png",
    seats: 5,
    fuel: "Petrol",
    transmission: "Manual",
    available: true
  },
  {
    id: "V004",
    name: "Royal Enfield Classic 350",
    type: "Bike",
    rentPerDay: 800,
    image: "assets/royal_enfield.png",
    seats: 2,
    fuel: "Petrol",
    transmission: "Manual",
    available: true
  },
  {
    id: "V005",
    name: "BMW 5 Series",
    type: "Luxury",
    rentPerDay: 7500,
    image: "assets/bmw.png",
    seats: 5,
    fuel: "Petrol",
    transmission: "Automatic",
    available: true
  },
  {
    id: "V006",
    name: "Hyundai Creta",
    type: "SUV",
    rentPerDay: 2500,
    image: "assets/creta.png",
    seats: 5,
    fuel: "Diesel",
    transmission: "Automatic",
    available: true
  }
];

// ── LocalStorage helpers ──
function getData(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return null;
  }
}

function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key}:`, e);
  }
}

// ── Initialize data on first load ──
function initializeData() {
  if (!getData('df_vehicles')) {
    setData('df_vehicles', DEFAULT_VEHICLES);
  }
  if (!getData('df_customers')) {
    setData('df_customers', []);
  }
  if (!getData('df_rentals')) {
    setData('df_rentals', []);
  }
  if (!getData('df_nextIds')) {
    setData('df_nextIds', { vehicle: 7, customer: 1, rental: 1 });
  }
}

function getVehicles() { return getData('df_vehicles') || []; }
function getCustomers() { return getData('df_customers') || []; }
function getRentals() { return getData('df_rentals') || []; }
function getNextIds() { return getData('df_nextIds') || { vehicle: 7, customer: 1, rental: 1 }; }

function generateId(type) {
  const ids = getNextIds();
  const prefix = type === 'vehicle' ? 'V' : type === 'customer' ? 'C' : 'R';
  const num = ids[type] || 1;
  ids[type] = num + 1;
  setData('df_nextIds', ids);
  return `${prefix}${String(num).padStart(3, '0')}`;
}


// ══════════════════════════════════════
// ═══ NAVIGATION & ROUTING ═══
// ══════════════════════════════════════

let currentPage = 'home';
let selectedRentVehicle = null;
let currentRentStep = 1;

function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page-section').forEach(s => {
    s.classList.remove('active');
  });

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.add('active');
  }

  // Update nav links
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    if (a.dataset.page === page) a.classList.add('active');
  });

  currentPage = page;
  window.location.hash = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile menu
  document.getElementById('navLinks').classList.remove('open');

  // Page-specific initialization
  if (page === 'vehicles') renderVehicles();
  if (page === 'rent') initRentPage();
  if (page === 'admin' && isAdminLoggedIn()) renderAdminDashboard();
}

function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ── Handle browser back/forward ──
window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '') || 'home';
  if (page !== currentPage) navigateTo(page);
});


// ══════════════════════════════════════
// ═══ TOAST NOTIFICATIONS ═══
// ══════════════════════════════════════

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.classList.add('removing'); setTimeout(() => this.parentElement.remove(), 300);">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}


// ══════════════════════════════════════
// ═══ VEHICLES PAGE ═══
// ══════════════════════════════════════

let currentFilter = 'all';

function filterVehicles(type) {
  currentFilter = type;

  // Update tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === type);
  });

  renderVehicles();
}

function renderVehicles() {
  const grid = document.getElementById('vehiclesGrid');
  if (!grid) return;

  const vehicles = getVehicles();
  const filtered = currentFilter === 'all'
    ? vehicles
    : vehicles.filter(v => v.type === currentFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🚫</div>
        <h3>No Vehicles Found</h3>
        <p>No vehicles match the selected filter.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((v, i) => `
    <div class="vehicle-card" style="animation-delay: ${i * 0.1}s">
      <div class="vehicle-card-image">
        <img src="${v.image}" alt="${v.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 220%22><rect fill=%22%23111827%22 width=%22400%22 height=%22220%22/><text x=%2250%%22 y=%2250%%22 fill=%22%2364748b%22 font-size=%2248%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>🚗</text></svg>'">
        <span class="vehicle-type-badge">${v.type}</span>
        <span class="vehicle-availability ${v.available ? 'available' : 'rented'}">
          ${v.available ? '● Available' : '● Rented'}
        </span>
      </div>
      <div class="vehicle-card-body">
        <h3>${v.name}</h3>
        <div class="vehicle-specs">
          <div class="vehicle-spec">
            <span class="spec-icon">👥</span> ${v.seats} Seats
          </div>
          <div class="vehicle-spec">
            <span class="spec-icon">⛽</span> ${v.fuel}
          </div>
          <div class="vehicle-spec">
            <span class="spec-icon">⚙️</span> ${v.transmission || 'Manual'}
          </div>
        </div>
        <div class="vehicle-card-footer">
          <div class="vehicle-price">₹${v.rentPerDay.toLocaleString()} <span>/day</span></div>
          ${v.available
            ? `<button class="btn btn-primary btn-sm" onclick="quickRent('${v.id}')">Rent Now</button>`
            : `<span class="badge badge-rented">Unavailable</span>`
          }
        </div>
      </div>
    </div>
  `).join('');
}

function quickRent(vehicleId) {
  selectedRentVehicle = vehicleId;
  navigateTo('rent');
  // Pre-select the vehicle
  setTimeout(() => selectRentVehicle(vehicleId), 100);
}


// ══════════════════════════════════════
// ═══ RENT PAGE — Multi-Step Booking ═══
// ══════════════════════════════════════

function initRentPage() {
  currentRentStep = 1;
  updateStepIndicator();
  renderRentVehicleGrid();

  // Set minimum dates
  const today = new Date().toISOString().split('T')[0];
  const rentDateInput = document.getElementById('rentDate');
  const returnDateInput = document.getElementById('returnDate');
  if (rentDateInput) rentDateInput.min = today;
  if (returnDateInput) returnDateInput.min = today;

  // Date change listeners for cost preview
  if (rentDateInput) rentDateInput.addEventListener('change', updateCostPreview);
  if (returnDateInput) returnDateInput.addEventListener('change', updateCostPreview);

  // If vehicle was pre-selected via quickRent
  if (selectedRentVehicle) {
    selectRentVehicle(selectedRentVehicle);
  }
}

function renderRentVehicleGrid() {
  const grid = document.getElementById('rentVehicleGrid');
  if (!grid) return;

  const vehicles = getVehicles().filter(v => v.available);

  if (vehicles.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">😔</div>
        <h3>No Vehicles Available</h3>
        <p>All vehicles are currently rented out. Please check back later.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = vehicles.map(v => `
    <div class="vehicle-select-card ${selectedRentVehicle === v.id ? 'selected' : ''}"
         onclick="selectRentVehicle('${v.id}')" id="selectCard-${v.id}">
      <img src="${v.image}" alt="${v.name}" onerror="this.style.display='none'">
      <div class="vehicle-select-info">
        <h4>${v.name}</h4>
        <p>${v.type} • ${v.seats} Seats</p>
        <p style="color: var(--accent-primary); font-weight: 700;">₹${v.rentPerDay.toLocaleString()}/day</p>
      </div>
    </div>
  `).join('');
}

function selectRentVehicle(vehicleId) {
  selectedRentVehicle = vehicleId;

  // Update visual selection
  document.querySelectorAll('.vehicle-select-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedCard = document.getElementById(`selectCard-${vehicleId}`);
  if (selectedCard) selectedCard.classList.add('selected');

  // Enable next button
  const nextBtn = document.getElementById('rentStep1Next');
  if (nextBtn) nextBtn.disabled = false;
}

function goToRentStep(step) {
  // Validation
  if (step === 2 && !selectedRentVehicle) {
    showToast('Please select a vehicle first', 'warning');
    return;
  }

  if (step === 3) {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    if (!name || !phone) {
      showToast('Please fill in your name and phone number', 'warning');
      return;
    }
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      showToast('Please enter a valid 10-digit phone number', 'warning');
      return;
    }
  }

  currentRentStep = step;
  updateStepIndicator();

  // Show/hide step content
  document.querySelectorAll('.step-content').forEach(sc => sc.classList.remove('active'));
  const stepContent = document.getElementById(`rentStep${step}`);
  if (stepContent) stepContent.classList.add('active');

  // Update cost preview when entering step 3
  if (step === 3) updateCostPreview();
}

function updateStepIndicator() {
  document.querySelectorAll('.step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.remove('active', 'completed');
    if (stepNum === currentRentStep) step.classList.add('active');
    else if (stepNum < currentRentStep) step.classList.add('completed');
  });
}

function updateCostPreview() {
  const rentDate = document.getElementById('rentDate').value;
  const returnDate = document.getElementById('returnDate').value;
  const preview = document.getElementById('costPreview');

  if (!rentDate || !returnDate || !selectedRentVehicle) {
    preview.style.display = 'none';
    return;
  }

  const start = new Date(rentDate);
  const end = new Date(returnDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    showToast('Return date must be after start date', 'warning');
    preview.style.display = 'none';
    return;
  }

  const vehicle = getVehicles().find(v => v.id === selectedRentVehicle);
  if (!vehicle) return;

  const totalCost = days * vehicle.rentPerDay;

  document.getElementById('previewVehicle').textContent = vehicle.name;
  document.getElementById('previewRate').textContent = `₹${vehicle.rentPerDay.toLocaleString()}`;
  document.getElementById('previewDays').textContent = `${days} day${days > 1 ? 's' : ''}`;
  document.getElementById('previewTotal').textContent = `₹${totalCost.toLocaleString()}`;

  preview.style.display = 'block';
}

function confirmRental() {
  // Final validation
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const email = document.getElementById('customerEmail').value.trim();
  const rentDate = document.getElementById('rentDate').value;
  const returnDate = document.getElementById('returnDate').value;

  if (!selectedRentVehicle || !name || !phone || !rentDate || !returnDate) {
    showToast('Please complete all required fields', 'error');
    return;
  }

  const start = new Date(rentDate);
  const end = new Date(returnDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    showToast('Return date must be after start date', 'error');
    return;
  }

  const vehicle = getVehicles().find(v => v.id === selectedRentVehicle);
  if (!vehicle || !vehicle.available) {
    showToast('Selected vehicle is no longer available', 'error');
    return;
  }

  const totalCost = days * vehicle.rentPerDay;

  // Create customer
  const customerId = generateId('customer');
  const customer = { id: customerId, name, phone, email };
  const customers = getCustomers();
  customers.push(customer);
  setData('df_customers', customers);

  // Create rental
  const rentalId = generateId('rental');
  const rental = {
    id: rentalId,
    customerId,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    customerName: name,
    customerPhone: phone,
    rentDate,
    returnDate,
    actualReturnDate: null,
    totalCost,
    lateFee: 0,
    status: 'active'
  };

  const rentals = getRentals();
  rentals.push(rental);
  setData('df_rentals', rentals);

  // Mark vehicle as unavailable
  const vehicles = getVehicles();
  const vIndex = vehicles.findIndex(v => v.id === vehicle.id);
  if (vIndex !== -1) {
    vehicles[vIndex].available = false;
    setData('df_vehicles', vehicles);
  }

  // Show receipt
  showReceipt(rental, vehicle, customer);

  // Reset form
  selectedRentVehicle = null;
  currentRentStep = 1;
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerEmail').value = '';
  document.getElementById('rentDate').value = '';
  document.getElementById('returnDate').value = '';
  document.getElementById('costPreview').style.display = 'none';
  document.getElementById('rentStep1Next').disabled = true;

  showToast(`Vehicle booked successfully! Rental ID: ${rentalId}`, 'success');
}


// ══════════════════════════════════════
// ═══ RECEIPT ═══
// ══════════════════════════════════════

function showReceipt(rental, vehicle, customer) {
  const content = document.getElementById('receiptContent');
  const days = Math.ceil(
    (new Date(rental.returnDate) - new Date(rental.rentDate)) / (1000 * 60 * 60 * 24)
  );

  content.innerHTML = `
    <div class="receipt-header">
      <h2 style="font-size: 1.8rem;">🚗 DriveFleet</h2>
      <p style="color: var(--text-muted); font-size: 0.85rem;">Online Vehicle Rental System</p>
      <p style="color: var(--accent-primary); font-weight: 700; margin-top: var(--space-sm);">
        Rental ID: ${rental.id}
      </p>
    </div>

    <h4 style="margin-bottom: var(--space-md); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Customer Details</h4>
    <div class="receipt-row">
      <span class="label">Name</span>
      <span class="value">${customer.name}</span>
    </div>
    <div class="receipt-row">
      <span class="label">Phone</span>
      <span class="value">${customer.phone}</span>
    </div>

    <h4 style="margin: var(--space-lg) 0 var(--space-md); color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Rental Details</h4>
    <div class="receipt-row">
      <span class="label">Vehicle</span>
      <span class="value">${vehicle.name}</span>
    </div>
    <div class="receipt-row">
      <span class="label">Type</span>
      <span class="value">${vehicle.type}</span>
    </div>
    <div class="receipt-row">
      <span class="label">Rate per Day</span>
      <span class="value">₹${vehicle.rentPerDay.toLocaleString()}</span>
    </div>
    <div class="receipt-row">
      <span class="label">Pick-up Date</span>
      <span class="value">${formatDate(rental.rentDate)}</span>
    </div>
    <div class="receipt-row">
      <span class="label">Return Date</span>
      <span class="value">${formatDate(rental.returnDate)}</span>
    </div>
    <div class="receipt-row">
      <span class="label">Duration</span>
      <span class="value">${days} day${days > 1 ? 's' : ''}</span>
    </div>

    <div class="receipt-row receipt-total">
      <span class="label" style="font-weight: 700; font-size: 1.1rem;">Total Amount</span>
      <span class="value">₹${rental.totalCost.toLocaleString()}</span>
    </div>

    <p style="text-align: center; margin-top: var(--space-lg); font-size: 0.8rem; color: var(--text-muted);">
      Thank you for choosing DriveFleet! 🙏<br>
      Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
    </p>
  `;

  document.getElementById('receiptModal').classList.add('active');
}

function closeReceipt() {
  document.getElementById('receiptModal').classList.remove('active');
}

function printReceipt() {
  window.print();
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}


// ══════════════════════════════════════
// ═══ RETURN PAGE ═══
// ══════════════════════════════════════

function processReturn() {
  const rentalId = document.getElementById('returnRentalId').value.trim().toUpperCase();
  const actualReturnDate = document.getElementById('actualReturnDate').value;
  const resultDiv = document.getElementById('returnResult');

  if (!rentalId) {
    showToast('Please enter a Rental ID', 'warning');
    return;
  }

  if (!actualReturnDate) {
    showToast('Please select the actual return date', 'warning');
    return;
  }

  const rentals = getRentals();
  const rental = rentals.find(r => r.id === rentalId);

  if (!rental) {
    showToast('Rental ID not found. Please check and try again.', 'error');
    resultDiv.style.display = 'none';
    return;
  }

  if (rental.status === 'completed') {
    showToast('This rental has already been returned', 'warning');
    resultDiv.style.display = 'none';
    return;
  }

  const vehicle = getVehicles().find(v => v.id === rental.vehicleId);
  const expectedReturn = new Date(rental.returnDate);
  const actualReturn = new Date(actualReturnDate);
  const rentStart = new Date(rental.rentDate);

  // Calculate actual days and cost
  const actualDays = Math.max(1, Math.ceil((actualReturn - rentStart) / (1000 * 60 * 60 * 24)));
  const ratePerDay = vehicle ? vehicle.rentPerDay : 0;
  const baseCost = actualDays * ratePerDay;

  // Late fee calculation (10% surcharge per late day)
  let lateFee = 0;
  let lateDays = 0;
  if (actualReturn > expectedReturn) {
    lateDays = Math.ceil((actualReturn - expectedReturn) / (1000 * 60 * 60 * 24));
    lateFee = lateDays * ratePerDay * 0.1;
  }

  const finalCost = baseCost + lateFee;

  resultDiv.innerHTML = `
    <div class="glass-card">
      <h3 style="margin-bottom: var(--space-lg); color: var(--success);">✅ Return Summary</h3>
      
      <div class="receipt-row">
        <span class="label">Rental ID</span>
        <span class="value">${rental.id}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Customer</span>
        <span class="value">${rental.customerName}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Vehicle</span>
        <span class="value">${rental.vehicleName}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Rent Date</span>
        <span class="value">${formatDate(rental.rentDate)}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Expected Return</span>
        <span class="value">${formatDate(rental.returnDate)}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Actual Return</span>
        <span class="value">${formatDate(actualReturnDate)}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Total Days</span>
        <span class="value">${actualDays} day${actualDays > 1 ? 's' : ''}</span>
      </div>
      <div class="receipt-row">
        <span class="label">Base Cost</span>
        <span class="value">₹${baseCost.toLocaleString()}</span>
      </div>
      ${lateFee > 0 ? `
        <div class="receipt-row" style="color: var(--danger);">
          <span class="label">⚠️ Late Fee (${lateDays} day${lateDays > 1 ? 's' : ''} × 10%)</span>
          <span class="value" style="color: var(--danger);">+ ₹${lateFee.toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="receipt-row receipt-total">
        <span class="label" style="font-weight: 700; font-size: 1.1rem;">Final Amount</span>
        <span class="value">₹${finalCost.toLocaleString()}</span>
      </div>

      <button class="btn btn-success" onclick="confirmReturn('${rental.id}', '${actualReturnDate}', ${finalCost}, ${lateFee})" style="width: 100%; margin-top: var(--space-lg);">
        ✅ Confirm Return
      </button>
    </div>
  `;

  resultDiv.style.display = 'block';
}

function confirmReturn(rentalId, actualReturnDate, finalCost, lateFee) {
  const rentals = getRentals();
  const rentalIndex = rentals.findIndex(r => r.id === rentalId);

  if (rentalIndex === -1) return;

  // Update rental
  rentals[rentalIndex].status = 'completed';
  rentals[rentalIndex].actualReturnDate = actualReturnDate;
  rentals[rentalIndex].totalCost = finalCost;
  rentals[rentalIndex].lateFee = lateFee;
  setData('df_rentals', rentals);

  // Mark vehicle as available again
  const vehicles = getVehicles();
  const vIndex = vehicles.findIndex(v => v.id === rentals[rentalIndex].vehicleId);
  if (vIndex !== -1) {
    vehicles[vIndex].available = true;
    setData('df_vehicles', vehicles);
  }

  showToast(`Vehicle returned successfully! Final cost: ₹${finalCost.toLocaleString()}`, 'success');

  // Reset form
  document.getElementById('returnRentalId').value = '';
  document.getElementById('actualReturnDate').value = '';
  document.getElementById('returnResult').style.display = 'none';
}


// ══════════════════════════════════════
// ═══ ADMIN PANEL ═══
// ══════════════════════════════════════

const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

function isAdminLoggedIn() {
  return getData('df_adminSession') === true;
}

function adminLogin() {
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();

  if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
    setData('df_adminSession', true);
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    renderAdminDashboard();
    showToast('Welcome, Admin! 👋', 'success');
  } else {
    showToast('Invalid credentials. Try admin / admin123', 'error');
  }
}

function adminLogout() {
  setData('df_adminSession', false);
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
  showToast('Logged out successfully', 'info');
}

function renderAdminDashboard() {
  const vehicles = getVehicles();
  const rentals = getRentals();
  const availableCount = vehicles.filter(v => v.available).length;
  const rentedCount = vehicles.filter(v => !v.available).length;
  const activeRentals = rentals.filter(r => r.status === 'active').length;
  const totalRevenue = rentals.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  // Stats cards
  document.getElementById('adminStats').innerHTML = `
    <div class="admin-stat-card">
      <div class="stat-icon" style="background: rgba(6, 182, 212, 0.12); color: var(--accent-primary);">🚗</div>
      <div class="stat-value">${vehicles.length}</div>
      <div class="stat-label">Total Vehicles</div>
    </div>
    <div class="admin-stat-card">
      <div class="stat-icon" style="background: var(--success-bg); color: var(--success);">✅</div>
      <div class="stat-value">${availableCount}</div>
      <div class="stat-label">Available</div>
    </div>
    <div class="admin-stat-card">
      <div class="stat-icon" style="background: var(--warning-bg); color: var(--warning);">📋</div>
      <div class="stat-value">${activeRentals}</div>
      <div class="stat-label">Active Rentals</div>
    </div>
    <div class="admin-stat-card">
      <div class="stat-icon" style="background: rgba(139, 92, 246, 0.12); color: var(--accent-secondary);">💰</div>
      <div class="stat-value">₹${totalRevenue.toLocaleString()}</div>
      <div class="stat-label">Total Revenue</div>
    </div>
  `;

  renderAdminVehicles();
  renderAdminRentals();
}

function switchAdminTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  // Show/hide content
  document.getElementById('adminTabVehicles').style.display = tab === 'vehicles' ? 'block' : 'none';
  document.getElementById('adminTabRentals').style.display = tab === 'rentals' ? 'block' : 'none';
  document.getElementById('adminTabAdd').style.display = tab === 'add' ? 'block' : 'none';
}

function renderAdminVehicles() {
  const tbody = document.getElementById('adminVehicleBody');
  if (!tbody) return;

  const vehicles = getVehicles();

  tbody.innerHTML = vehicles.map(v => `
    <tr>
      <td><code style="color: var(--accent-primary);">${v.id}</code></td>
      <td>
        <div style="display: flex; align-items: center; gap: var(--space-sm);">
          <img src="${v.image}" alt="${v.name}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 6px;" onerror="this.style.display='none'">
          <span style="color: var(--text-primary); font-weight: 500;">${v.name}</span>
        </div>
      </td>
      <td>${v.type}</td>
      <td style="color: var(--accent-primary); font-weight: 600;">₹${v.rentPerDay.toLocaleString()}</td>
      <td>
        <span class="badge ${v.available ? 'badge-available' : 'badge-rented'}">
          ${v.available ? 'Available' : 'Rented'}
        </span>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteVehicle('${v.id}')" ${!v.available ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
          🗑️ Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function renderAdminRentals() {
  const tbody = document.getElementById('adminRentalBody');
  if (!tbody) return;

  let rentals = getRentals();
  
  // Search filter
  const searchTerm = document.getElementById('rentalSearch')?.value?.toLowerCase() || '';
  if (searchTerm) {
    rentals = rentals.filter(r =>
      r.id.toLowerCase().includes(searchTerm) ||
      r.customerName.toLowerCase().includes(searchTerm) ||
      r.vehicleName.toLowerCase().includes(searchTerm)
    );
  }

  // Sort by most recent first
  rentals = [...rentals].reverse();

  if (rentals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: var(--space-2xl);">
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No Rentals Yet</h3>
            <p>${searchTerm ? 'No rentals match your search.' : 'Rental records will appear here.'}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rentals.map(r => `
    <tr>
      <td><code style="color: var(--accent-primary);">${r.id}</code></td>
      <td>
        <div>
          <span style="color: var(--text-primary); font-weight: 500;">${r.customerName}</span>
          <br><span style="font-size: 0.8rem; color: var(--text-muted);">${r.customerPhone}</span>
        </div>
      </td>
      <td>${r.vehicleName}</td>
      <td>
        <span style="font-size: 0.85rem;">${formatDate(r.rentDate)} → ${formatDate(r.returnDate)}</span>
      </td>
      <td style="font-weight: 600;">
        ₹${r.totalCost.toLocaleString()}
        ${r.lateFee > 0 ? `<br><span style="font-size: 0.75rem; color: var(--danger);">+₹${r.lateFee.toLocaleString()} late fee</span>` : ''}
      </td>
      <td>
        <span class="badge ${r.status === 'active' ? 'badge-warning' : 'badge-completed'}">
          ${r.status === 'active' ? '🔶 Active' : '✅ Completed'}
        </span>
      </td>
    </tr>
  `).join('');
}

function deleteVehicle(vehicleId) {
  if (!confirm('Are you sure you want to remove this vehicle?')) return;

  const vehicles = getVehicles().filter(v => v.id !== vehicleId);
  setData('df_vehicles', vehicles);
  renderAdminDashboard();
  showToast('Vehicle removed successfully', 'success');
}

function addNewVehicle() {
  const name = document.getElementById('newVehicleName').value.trim();
  const type = document.getElementById('newVehicleType').value;
  const rate = parseInt(document.getElementById('newVehicleRate').value);
  const seats = parseInt(document.getElementById('newVehicleSeats').value) || 5;
  const fuel = document.getElementById('newVehicleFuel').value;

  if (!name) {
    showToast('Please enter a vehicle name', 'warning');
    return;
  }

  if (!rate || rate <= 0) {
    showToast('Please enter a valid rental rate', 'warning');
    return;
  }

  const vehicleId = generateId('vehicle');
  const typeEmojis = { SUV: '🚙', Sedan: '🚗', Hatchback: '🚕', Bike: '🏍️', Luxury: '✨' };

  const newVehicle = {
    id: vehicleId,
    name,
    type,
    rentPerDay: rate,
    image: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 220%22><rect fill=%22%23111827%22 width=%22400%22 height=%22220%22/><text x=%2250%%22 y=%2240%%22 fill=%22%2364748b%22 font-size=%2248%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>${typeEmojis[type] || '🚗'}</text><text x=%2250%%22 y=%2270%%22 fill=%22%2394a3b8%22 font-size=%2218%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22>${encodeURIComponent(name)}</text></svg>`,
    seats,
    fuel,
    transmission: 'Manual',
    available: true
  };

  const vehicles = getVehicles();
  vehicles.push(newVehicle);
  setData('df_vehicles', vehicles);

  // Reset form
  document.getElementById('newVehicleName').value = '';
  document.getElementById('newVehicleRate').value = '';
  document.getElementById('newVehicleSeats').value = '5';

  renderAdminDashboard();
  showToast(`Vehicle "${name}" added successfully! ID: ${vehicleId}`, 'success');
}


// ══════════════════════════════════════
// ═══ HERO STATS COUNTER ANIMATION ═══
// ══════════════════════════════════════

function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current).toLocaleString() + (counter.dataset.target === '99' ? '%' : '+');
    }, 16);
  });
}

// Intersection observer to trigger counter animation
function setupCounterObserver() {
  const statsRow = document.getElementById('heroStats');
  if (!statsRow) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(statsRow);
}


// ══════════════════════════════════════
// ═══ INITIALIZATION ═══
// ══════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Initialize data
  initializeData();

  // Setup counter animation
  setupCounterObserver();

  // Handle initial hash
  const hash = window.location.hash.replace('#', '') || 'home';
  navigateTo(hash);

  // Check admin session
  if (isAdminLoggedIn()) {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
  }

  // Set today's date for return
  const today = new Date().toISOString().split('T')[0];
  const returnDateInput = document.getElementById('actualReturnDate');
  if (returnDateInput) {
    returnDateInput.value = today;
  }

  console.log('🚗 DriveFleet — Online Vehicle Rental System loaded!');
  console.log(`📊 ${getVehicles().length} vehicles | ${getRentals().length} rentals in database`);
});
