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
    
    if (statusFilter) statusFilter.addEventListener('change', loadAllBookings);
    if (dateFilter) dateFilter.addEventListener('change', loadAllBookings);
    if (customerSearch) customerSearch.addEventListener('input', debounce(loadCustomers, 500));
    if (reportPeriod) reportPeriod.addEventListener('change', loadReports);
    
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
        case 'cars':
            console.log('🚗 Loading cars...');
            loadCarsManagement();
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

// Load cars management
async function loadCarsManagement() {
    try {
        console.log('🚗 Loading cars...');
        showLoading('carsList', 'Loading cars...');
        
        const response = await mobileFetch(`${API_BASE}/admin/cars`);
        const result = await response.json();
        
        console.log('🚗 Cars API Response:', result);
        
        if (result.success) {
            displayCars(result.cars);
            console.log('✅ Cars loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load cars');
        }
    } catch (error) {
        console.error('❌ Error loading cars:', error);
        showNotification('Error loading cars: ' + error.message, 'error');
    }
}

// Display cars
function displayCars(cars) {
    const container = document.getElementById('carsList');
    
    if (!cars || cars.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-car-crash"></i>
                <h3>No Cars Found</h3>
                <p>No cars are available in the system.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Car</th>
                        <th>Type</th>
                        <th>Price/Day</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cars.map(car => `
                        <tr>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${car.make} ${car.model}</div>
                                    <div class="customer-detail">${car.year}</div>
                                </div>
                            </td>
                            <td>${car.type}</td>
                            <td>₹${car.pricePerDay}</td>
                            <td>
                                <span class="status-badge completed">${car.bookingCount || 0}</span>
                            </td>
                            <td>
                                <strong>₹${(car.totalRevenue || 0).toLocaleString()}</strong>
                            </td>
                            <td>
                                <span class="status-badge ${car.available ? 'completed' : 'cancelled'}">
                                    ${car.available ? 'Available' : 'Not Available'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <select class="status-select" onchange="updateCarAvailability('${car._id}', this.value)">
                                        <option value="">Availability</option>
                                        <option value="true" ${car.available ? 'selected' : ''}>Available</option>
                                        <option value="false" ${!car.available ? 'selected' : ''}>Not Available</option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
            Showing ${cars.length} cars • ${cars.filter(car => car.available).length} available
        </div>
    `;
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

// Display reports
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
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Revenue by Car Type</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${reports.revenueByCarType.map(type => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 4px;">
                            <span style="font-weight: 500;">${type._id}</span>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #1e293b;">₹${type.revenue.toLocaleString()}</div>
                                <div style="font-size: 0.8rem; color: #64748b;">${type.bookings} bookings</div>
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
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Popular Cars</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${reports.popularCars.slice(0, 5).map(car => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f8fafc; border-radius: 4px;">
                            <span style="font-weight: 500;">${car._id.make} ${car._id.model}</span>
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; color: #64748b;">${car.bookings} bookings</div>
                                <div style="font-weight: bold; color: #10b981;">₹${car.revenue.toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Top Customers
    if (reports.topCustomers && reports.topCustomers.length > 0) {
        reportsHTML += `
            <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Top Customers</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    ${reports.topCustomers.slice(0, 6).map(customer => `
                        <div style="padding: 1rem; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;">${customer.name}</div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">${customer.email}</div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-size: 0.8rem;">${customer.bookings} bookings</span>
                                <span style="font-weight: bold; color: #10b981;">₹${customer.totalSpent.toLocaleString()}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    reportsHTML += '</div>';
    container.innerHTML = reportsHTML;
}

// Update car availability
async function updateCarAvailability(carId, available) {
    if (!available) return;
    
    if (!confirm(`Are you sure you want to mark this car as ${available === 'true' ? 'available' : 'not available'}?`)) {
        return;
    }
    
    try {
        console.log(`🔄 Updating car ${carId} availability to ${available}`);
        
        const response = await mobileFetch(`${API_BASE}/admin/cars/${carId}/availability`, {
            method: 'PUT',
            body: JSON.stringify({ available: available === 'true' })
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification(`Car availability updated successfully`, 'success');
            loadCarsManagement();
            console.log('✅ Car availability updated successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error updating car availability:', error);
        showNotification('Error updating car availability: ' + error.message, 'error');
    }
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
                        <span style="font-weight: 600; color: #475569;">Total Price:</span>
                        <span style="font-weight: 700; color: #1e293b;">₹${booking.totalPrice}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Status:</span>
                        <span class="status-badge ${booking.status}">${booking.status}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    if (!status) return;
    
    let adminNotes = '';
    if (status === 'confirmed') {
        adminNotes = prompt('Add any notes for this confirmation (optional):');
        if (adminNotes === null) return; // User cancelled
    }
    
    if (!confirm(`Are you sure you want to change booking status to "${status}"?`)) {
        return;
    }
    
    try {
        console.log(`🔄 Updating booking ${bookingId} status to ${status}`);
        
        const response = await mobileFetch(`${API_BASE}/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ 
                status,
                adminNotes: adminNotes || undefined
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification(`Booking status updated to ${status}`, 'success');
            loadAllBookings();
            loadDashboardStats();
            loadRecentBookings();
            console.log('✅ Booking status updated successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error updating booking status:', error);
        showNotification('Error updating status: ' + error.message, 'error');
    }
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

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Logout
function logout() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (confirm('Are you sure you want to logout from admin dashboard?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        max-width: 90vw;
        word-wrap: break-word;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
            <div>
                <div style="font-weight: 600; margin-bottom: 0.25rem;">
                    ${type === 'success' ? '✅ Success' : type === 'error' ? '❌ Error' : 'ℹ️ Info'}
                </div>
                <div>${message}</div>
            </div>
            <button style="background: none; border: none; color: inherit; cursor: pointer; flex-shrink: 0;" 
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

console.log('✅ Admin Dashboard JavaScript loaded successfully!');