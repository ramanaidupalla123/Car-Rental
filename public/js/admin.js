// Dynamic API Base URL for mobile compatibility
const API_BASE = (function() {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const productionUrl = `${window.location.origin}/api`;
        console.log('🌐 Admin Production API URL:', productionUrl);
        return productionUrl;
    }
    const localUrl = 'http://localhost:10000/api';
    console.log('🌐 Admin Local API URL:', localUrl);
    return localUrl;
})();

// Enhanced fetch with mobile error handling
async function mobileFetch(url, options = {}) {
    try {
        console.log('📡 Admin API Call:', url);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const fetchOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                ...options.headers
            }
        };
        
        const response = await fetch(url, fetchOptions);
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
            throw new Error('Session expired. Please login again.');
        }

        if (response.status === 403) {
            throw new Error('Access denied. Admin privileges required.');
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error('📱 Admin Mobile fetch error:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please check your internet connection.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network connection failed. Please check your internet and try again.');
        }
        
        throw error;
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard Initializing...');
    console.log('🌐 Admin API Base:', API_BASE);
    
    checkAdminAuth();
    setupAdminEventListeners();
    loadDashboardStats();
    loadRecentBookings();
});

// Check if user is admin
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔐 Admin Auth Check:', { 
        user: user.email, 
        role: user.role,
        hasToken: !!token 
    });
    
    if (!token) {
        showNotification('Please login first to access admin dashboard.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    if (user.role !== 'admin') {
        showNotification(`Access Denied. User ${user.email} does not have admin privileges.`, 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    document.getElementById('adminWelcome').textContent = `Welcome, ${user.name} (Admin)`;
    console.log('✅ Admin authentication successful');
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Tab navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            console.log(`📱 Switching to tab: ${tab}`);
            switchTab(tab);
        });
    });
    
    // Filter event listeners
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const customerSearch = document.getElementById('customerSearch');
    const reportPeriod = document.getElementById('reportPeriod');
    const carStatusFilter = document.getElementById('carStatusFilter');
    
    if (statusFilter) statusFilter.addEventListener('change', loadAllBookings);
    if (dateFilter) dateFilter.addEventListener('change', loadAllBookings);
    if (customerSearch) customerSearch.addEventListener('input', debounce(loadCustomers, 500));
    if (reportPeriod) reportPeriod.addEventListener('change', loadReports);
    if (carStatusFilter) carStatusFilter.addEventListener('change', loadAllCars);
    
    // Add car form submission
    const addCarForm = document.getElementById('addCarForm');
    if (addCarForm) {
        addCarForm.addEventListener('submit', handleAddCarForm);
    }
    
    console.log('✅ Admin event listeners setup complete');
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Switch between tabs
function switchTab(tabName) {
    console.log(`🔄 Switching to tab: ${tabName}`);
    
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            console.log('📊 Loading dashboard data...');
            loadDashboardStats();
            loadRecentBookings();
            break;
        case 'bookings':
            console.log('📋 Loading all bookings...');
            loadAllBookings();
            break;
        case 'customers':
            console.log('👥 Loading customers...');
            loadCustomers();
            break;
        case 'cars-management':
            console.log('🚗 Loading cars management...');
            loadAllCars();
            break;
        case 'add-car':
            console.log('➕ Add car form ready');
            // No data loading needed for add car form
            break;
        case 'reports':
            console.log('📈 Loading reports...');
            loadReports();
            break;
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        console.log('📊 Fetching dashboard statistics...');
        
        const response = await mobileFetch(`${API_BASE}/admin/stats`);
        const result = await response.json();
        
        console.log('📊 Stats API Response:', result);
        
        if (result.success) {
            const stats = result.stats;
            document.getElementById('totalBookings').textContent = stats.totalBookings.toLocaleString();
            document.getElementById('confirmedBookings').textContent = stats.confirmedBookings.toLocaleString();
            document.getElementById('pendingBookings').textContent = stats.pendingBookings.toLocaleString();
            document.getElementById('activeBookings').textContent = stats.activeBookings.toLocaleString();
            document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
            document.getElementById('todaysBookings').textContent = stats.todaysBookings.toLocaleString();
            
            console.log('✅ Dashboard statistics loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load statistics');
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        showNotification('Error loading dashboard statistics: ' + error.message, 'error');
    }
}

// Load recent bookings
async function loadRecentBookings() {
    try {
        console.log('🔄 Loading recent bookings...');
        
        const response = await mobileFetch(`${API_BASE}/admin/bookings?limit=6`);
        const result = await response.json();
        
        console.log('📋 Recent Bookings API Response:', result);
        
        if (result.success) {
            displayRecentBookings(result.bookings);
            console.log('✅ Recent bookings loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load recent bookings');
        }
    } catch (error) {
        console.error('❌ Error loading recent bookings:', error);
        showNotification('Error loading recent bookings: ' + error.message, 'error');
    }
}

// Display recent bookings
function displayRecentBookings(bookings) {
    const container = document.getElementById('recentBookingsList');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <h3>No Recent Bookings</h3>
                <p>There are no recent bookings to display.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="recent-bookings-grid">
            ${bookings.map(booking => `
                <div class="recent-booking-card" onclick="showBookingDetails('${booking._id}')">
                    <div class="booking-card-header">
                        <div class="booking-customer">
                            <h4>${booking.user?.name || 'N/A'}</h4>
                            <div class="booking-car">
                                ${booking.car?.make || ''} ${booking.car?.model || ''}
                            </div>
                        </div>
                        <span class="status-badge ${booking.status}">${booking.status}</span>
                    </div>
                    <div class="customer-detail">
                        <div><i class="fas fa-phone"></i> ${booking.user?.phone || 'N/A'}</div>
                        <div><i class="fas fa-envelope"></i> ${booking.user?.email || 'N/A'}</div>
                    </div>
                    <div class="booking-meta">
                        <div>
                            <div style="font-size: 0.9rem; color: #64748b;">Booking Date</div>
                            <div style="font-weight: 500;">${new Date(booking.startDate).toLocaleDateString()}</div>
                        </div>
                        <div class="booking-price">₹${booking.totalPrice}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load all bookings with filters
async function loadAllBookings() {
    try {
        console.log('📋 Loading all bookings...');
        showLoading('allBookingsList', 'Loading customer bookings...');
        
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        
        let url = `${API_BASE}/admin/bookings`;
        const params = new URLSearchParams();
        
        if (statusFilter) params.append('status', statusFilter);
        if (dateFilter) params.append('date', dateFilter);
        params.append('limit', '100');
        
        if (params.toString()) url += `?${params.toString()}`;
        
        console.log('📡 Fetching bookings from:', url);
        
        const response = await mobileFetch(url);
        const result = await response.json();
        
        console.log('📋 All Bookings API Response:', result);
        
        if (result.success) {
            displayAllBookings(result.bookings);
            console.log('✅ All bookings loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load bookings');
        }
    } catch (error) {
        console.error('❌ Error loading all bookings:', error);
        showNotification('Error loading bookings: ' + error.message, 'error');
    }
}

// Display all bookings in table
function displayAllBookings(bookings) {
    const container = document.getElementById('allBookingsList');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <h3>No Bookings Found</h3>
                <p>No bookings match your current filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Car</th>
                        <th>Dates</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${booking.user?.name || 'N/A'}</div>
                                    <div class="customer-detail">${booking.user?.email || 'N/A'}</div>
                                    <div class="customer-detail">${booking.user?.phone || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${booking.car?.make || ''} ${booking.car?.model || ''}</div>
                                    <div class="customer-detail">${booking.car?.type || ''}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail">${new Date(booking.startDate).toLocaleDateString()}</div>
                                    <div class="customer-detail">to ${new Date(booking.endDate).toLocaleDateString()}</div>
                                </div>
                            </td>
                            <td><strong>₹${booking.totalPrice}</strong></td>
                            <td>
                                <span class="status-badge ${booking.status}">${booking.status}</span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-view" onclick="showBookingDetails('${booking._id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <select class="status-select" onchange="updateBookingStatus('${booking._id}', this.value)">
                                        <option value="">Change Status</option>
                                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                        <option value="active" ${booking.status === 'active' ? 'selected' : ''}>Active</option>
                                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
            Showing ${bookings.length} bookings
        </div>
    `;
}

// Load customers
async function loadCustomers() {
    try {
        console.log('👥 Loading customers...');
        showLoading('customersList', 'Loading customers...');
        
        const searchQuery = document.getElementById('customerSearch')?.value || '';
        
        let url = `${API_BASE}/admin/users`;
        if (searchQuery) {
            url += `?search=${encodeURIComponent(searchQuery)}`;
        }
        
        const response = await mobileFetch(url);
        const result = await response.json();
        
        console.log('👥 Customers API Response:', result);
        
        if (result.success) {
            displayCustomers(result.users);
            console.log('✅ Customers loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load customers');
        }
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        showNotification('Error loading customers: ' + error.message, 'error');
    }
}

// Display customers
function displayCustomers(users) {
    const container = document.getElementById('customersList');
    
    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users-slash"></i>
                <h3>No Customers Found</h3>
                <p>No customers match your search criteria.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Total Bookings</th>
                        <th>Total Spent</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(customer => `
                        <tr>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${customer.name}</div>
                                    <div class="customer-detail">Member since ${new Date(customer.createdAt).getFullYear()}</div>
                                </div>
                            </td>
                            <td>${customer.email}</td>
                            <td>${customer.phone}</td>
                            <td>
                                <span class="status-badge completed">${customer.bookingCount || 0}</span>
                            </td>
                            <td>
                                <strong>₹${(customer.totalSpent || 0).toLocaleString()}</strong>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
            Showing ${users.length} customers
        </div>
    `;
}

// CAR MANAGEMENT FUNCTIONS

// Load all cars for management - FIXED VERSION
async function loadAllCars() {
    try {
        console.log('🚗 Loading all cars for management...');
        const carsList = document.getElementById('carsList');
        const statusFilter = document.getElementById('carStatusFilter').value;
        
        showLoading('carsList', 'Loading cars...');
        
        // Use admin endpoint to get ALL cars (including unavailable ones)
        const response = await mobileFetch(`${API_BASE}/admin/cars`);
        const result = await response.json();

        if (result.success) {
            let cars = result.cars;
            
            console.log('=== CAR FILTERING DEBUG ===');
            console.log(`Total cars from admin API: ${cars.length}`);
            console.log(`Current filter: "${statusFilter}"`);
            
            // Log all cars with their availability for debugging
            cars.forEach((car, index) => {
                console.log(`${index + 1}. ${car.make} ${car.model} - Available: ${car.available}`);
            });

            // Apply filter
            let filteredCars = cars;
            if (statusFilter === 'available') {
                filteredCars = cars.filter(car => car.available === true);
                console.log(`✅ Available cars: ${filteredCars.length}`);
            } else if (statusFilter === 'unavailable') {
                filteredCars = cars.filter(car => car.available === false);
                console.log(`✅ Unavailable cars: ${filteredCars.length}`);
            }

            console.log(`Final cars to display: ${filteredCars.length}`);
            console.log('=== END DEBUG ===');

            if (filteredCars.length === 0) {
                carsList.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-car"></i>
                        <h3>No ${statusFilter ? statusFilter + ' ' : ''}cars found</h3>
                        <p>${statusFilter === 'unavailable' ? 
                            'All cars are currently available for booking.' : 
                            'No cars match your current filter criteria.'}
                        </p>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-primary" onclick="document.getElementById('carStatusFilter').value = ''; loadAllCars();">
                                Show All Cars
                            </button>
                        </div>
                    </div>
                `;
                return;
            }

            carsList.innerHTML = `
                <div class="cars-grid-admin">
                    ${filteredCars.map(car => `
                        <div class="car-card-admin ${!car.available ? 'unavailable' : ''}">
                            <img src="${car.images && car.images.length > 0 ? car.images[0].url : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                                 alt="${car.make} ${car.model}" 
                                 class="car-image-admin"
                                 onerror="this.src='https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                            <div class="car-info-admin">
                                <div class="car-header-admin">
                                    <h4 class="car-name-admin">${car.make} ${car.model}</h4>
                                    <span class="car-status-badge ${car.available ? 'available' : 'unavailable'}">
                                        ${car.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div class="car-details-admin">
                                    <span class="car-detail-item">
                                        <i class="fas fa-car"></i> ${car.type}
                                    </span>
                                    <span class="car-detail-item">
                                        <i class="fas fa-users"></i> ${car.seats} seats
                                    </span>
                                    <span class="car-detail-item">
                                        <i class="fas fa-gas-pump"></i> ${car.fuelType}
                                    </span>
                                </div>
                                <div class="car-price-admin">
                                    ₹${car.pricePerHour}/hour • ₹${car.pricePerDay}/day
                                </div>
                                <div class="car-actions-admin">
                                    <button class="btn-toggle-availability" onclick="toggleCarAvailability('${car._id}', ${!car.available})">
                                        ${car.available ? 'Make Unavailable' : 'Make Available'}
                                    </button>
                                    <button class="btn-remove-car" onclick="removeCar('${car._id}')">
                                        <i class="fas fa-trash"></i> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
                    Showing ${filteredCars.length} ${statusFilter ? statusFilter : 'all'} cars
                </div>
            `;
            console.log('✅ Cars loaded and displayed successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error loading cars:', error);
        document.getElementById('carsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading cars</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadAllCars()">Try Again</button>
            </div>
        `;
    }
}

// Toggle car availability - ENHANCED VERSION
async function toggleCarAvailability(carId, makeAvailable) {
    if (!confirm(`Are you sure you want to make this car ${makeAvailable ? 'available' : 'unavailable'}?`)) {
        return;
    }

    try {
        const response = await mobileFetch(`${API_BASE}/admin/cars/${carId}/availability`, {
            method: 'PUT',
            body: JSON.stringify({ available: makeAvailable })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Car ${makeAvailable ? 'made available' : 'made unavailable'} successfully!`, 'success');
            
            // Get current filter to maintain it after refresh
            const currentFilter = document.getElementById('carStatusFilter').value;
            
            // Reload cars with current filter maintained
            loadAllCars();
            
            console.log(`✅ Car availability updated to: ${makeAvailable}`);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error toggling car availability:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Remove car completely
async function removeCar(carId) {
    if (!confirm('Are you sure you want to remove this car? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await mobileFetch(`${API_BASE}/admin/cars/${carId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Car removed successfully!', 'success');
            loadAllCars();
            console.log('✅ Car removed successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error removing car:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Handle add car form submission
async function handleAddCarForm(e) {
    e.preventDefault();
    
    const carData = {
        make: document.getElementById('carMake').value.trim(),
        model: document.getElementById('carModel').value.trim(),
        year: parseInt(document.getElementById('carYear').value),
        type: document.getElementById('carType').value,
        seats: parseInt(document.getElementById('carSeats').value),
        fuelType: document.getElementById('carFuelType').value,
        transmission: document.getElementById('carTransmission').value,
        pricePerDay: parseInt(document.getElementById('carPricePerDay').value),
        pricePerHour: parseInt(document.getElementById('carPricePerHour').value),
        color: document.getElementById('carColor').value.trim(),
        mileage: document.getElementById('carMileage').value.trim(),
        features: document.getElementById('carFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        images: [{ 
            url: document.getElementById('carImageUrl').value.trim(),
            alt: `${document.getElementById('carMake').value.trim()} ${document.getElementById('carModel').value.trim()}`
        }],
        registrationNumber: document.getElementById('carRegistration').value.trim(),
        available: true
    };

    // Validate required fields
    if (!carData.make || !carData.model || !carData.type || !carData.fuelType || !carData.transmission) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (carData.pricePerDay <= 0 || carData.pricePerHour <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return;
    }

    try {
        const response = await mobileFetch(`${API_BASE}/admin/cars`, {
            method: 'POST',
            body: JSON.stringify(carData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Car added successfully!', 'success');
            resetCarForm();
            loadAllCars(); // Refresh cars list
            console.log('✅ Car added successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error adding car:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Reset car form
function resetCarForm() {
    document.getElementById('addCarForm').reset();
    document.getElementById('carYear').value = 2024;
    document.getElementById('carSeats').value = 5;
}

// Load reports
async function loadReports() {
    try {
        console.log('📈 Loading reports...');
        showLoading('reportsContent', 'Generating reports...');
        
        const period = document.getElementById('reportPeriod')?.value || '30';
        
        const response = await mobileFetch(`${API_BASE}/admin/reports?period=${period}`);
        const result = await response.json();
        
        console.log('📈 Reports API Response:', result);
        
        if (result.success) {
            displayReports(result.reports);
            console.log('✅ Reports loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load reports');
        }
    } catch (error) {
        console.error('❌ Error loading reports:', error);
        showNotification('Error loading reports: ' + error.message, 'error');
    }
}

// Display reports with dark text colors
function displayReports(reports) {
    const container = document.getElementById('reportsContent');
    
    if (!reports) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-chart-bar"></i>
                <h3>No Report Data</h3>
                <p>Unable to generate reports at this time.</p>
            </div>
        `;
        return;
    }
    
    let reportsHTML = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">';
    
    // Revenue by Car Type
    if (reports.revenueByCarType && reports.revenueByCarType.length > 0) {
        reportsHTML += `
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin: 0 0 1rem 0; color: #111827; font-weight: 600;">Revenue by Car Type</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${reports.revenueByCarType.map(type => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
                            <span style="font-weight: 600; color: #111827;">${type._id}</span>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #111827; font-size: 1.1rem;">₹${type.revenue.toLocaleString()}</div>
                                <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">${type.bookings} bookings</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Popular Cars
    if (reports.popularCars && reports.popularCars.length > 0) {
        reportsHTML += `
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin: 0 0 1rem 0; color: #111827; font-weight: 600;">Popular Cars</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${reports.popularCars.slice(0, 5).map(car => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
                            <div>
                                <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${car._id.make} ${car._id.model}</div>
                                <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">${car.bookings} bookings</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #059669; font-size: 1.1rem;">₹${car.revenue.toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Top Customers - ENHANCED WITH DARK TEXT COLORS
    if (reports.topCustomers && reports.topCustomers.length > 0) {
        reportsHTML += `
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
                <h4 style="margin: 0 0 1rem 0; color: #111827; font-weight: 600;">Top Customers</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
                    ${reports.topCustomers.slice(0, 6).map(customer => `
                        <div style="padding: 1.25rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div>
                                    <div style="font-weight: 700; color: #111827; font-size: 1.1rem; margin-bottom: 0.25rem;">${customer.name}</div>
                                    <div style="font-size: 0.9rem; color: #374151; font-weight: 500;">${customer.email}</div>
                                </div>
                                <div style="background: #3b82f6; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                                    ${customer.bookings} ${customer.bookings === 1 ? 'booking' : 'bookings'}
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.9rem; color: #374151; font-weight: 500;">Total Spent:</span>
                                <span style="font-weight: bold; color: #059669; font-size: 1.1rem;">₹${customer.totalSpent.toLocaleString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Booking Trends
    if (reports.bookingTrends && reports.bookingTrends.length > 0) {
        reportsHTML += `
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
                <h4 style="margin: 0 0 1rem 0; color: #111827; font-weight: 600;">Booking Trends (Last ${reports.period} Days)</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${reports.bookingTrends.slice(-7).map(trend => `
                        <div style="text-align: center; padding: 1rem; background: #f8fafc; border-radius: 6px;">
                            <div style="font-weight: 600; color: #111827; margin-bottom: 0.5rem;">${new Date(trend._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.25rem;">${trend.count}</div>
                            <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">₹${trend.revenue.toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    reportsHTML += '</div>';
    container.innerHTML = reportsHTML;
}

// Show booking details
async function showBookingDetails(bookingId) {
    try {
        console.log(`📋 Loading booking details for: ${bookingId}`);
        
        const response = await mobileFetch(`${API_BASE}/admin/bookings/${bookingId}`);
        const result = await response.json();
        
        if (result.success) {
            displayBookingDetails(result.booking);
            document.getElementById('bookingDetailsModal').style.display = 'block';
            console.log('✅ Booking details loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load booking details');
        }
    } catch (error) {
        console.error('❌ Error loading booking details:', error);
        showNotification('Error loading booking details: ' + error.message, 'error');
    }
}

// Display booking details in modal
function displayBookingDetails(booking) {
    const container = document.getElementById('bookingDetailsContent');
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-user" style="color: #3b82f6;"></i> Customer Information
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Name:</span>
                        <span>${booking.user?.name || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Email:</span>
                        <span>${booking.user?.email || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Phone:</span>
                        <span>${booking.user?.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-car" style="color: #10b981;"></i> Car Information
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Car:</span>
                        <span>${booking.car?.make || ''} ${booking.car?.model || ''} (${booking.car?.year || ''})</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Type:</span>
                        <span>${booking.car?.type || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Color:</span>
                        <span>${booking.car?.color || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Fuel Type:</span>
                        <span>${booking.car?.fuelType || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Transmission:</span>
                        <span>${booking.car?.transmission || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-calendar-alt" style="color: #f59e0b;"></i> Booking Details
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Start Date:</span>
                        <span>${new Date(booking.startDate).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">End Date:</span>
                        <span>${new Date(booking.endDate).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Duration:</span>
                        <span>${booking.duration} ${booking.rentalType}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Status:</span>
                        <span class="status-badge ${booking.status}">${booking.status}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-rupee-sign" style="color: #10b981;"></i> Payment Information
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Total Amount:</span>
                        <span style="font-weight: bold; font-size: 1.2rem; color: #10b981;">₹${booking.totalPrice}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Payment Method:</span>
                        <span>${booking.payment?.method || 'Cash'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Payment Status:</span>
                        <span class="status-badge ${booking.payment?.status || 'pending'}">${booking.payment?.status || 'Pending'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Booked On:</span>
                        <span>${new Date(booking.createdAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    if (!status) return;
    
    if (!confirm(`Are you sure you want to change booking status to ${status}?`)) {
        return;
    }

    try {
        const response = await mobileFetch(`${API_BASE}/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Booking status updated to ${status} successfully!`, 'success');
            loadAllBookings();
            console.log('✅ Booking status updated successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error updating booking status:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Show loading state
function showLoading(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' : 
                     type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        max-width: 90vw;
        word-wrap: break-word;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button style="background: none; border: none; color: inherit; margin-left: 10px; cursor: pointer;" 
                    onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Add notification styles
document.head.insertAdjacentHTML('beforeend', `
    <style>
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    </style>
`);