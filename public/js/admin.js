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

// Global variables
let currentSelectedUserId = null;

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
        case 'admin-management':
            console.log('👑 Loading admin management...');
            loadAdmins();
            break;
        case 'cars-management':
            console.log('🚗 Loading cars management...');
            loadAllCars();
            break;
        case 'add-car':
            console.log('➕ Add car form ready');
            break;
        case 'reports':
            console.log('📈 Loading reports...');
            loadReports();
            break;
        case 'reviews-management':
            console.log('📝 Loading reviews management...');
            loadAdminReviews();
            break;
    }
}

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

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        console.log('📊 Fetching dashboard statistics...');
        
        const response = await mobileFetch(`${API_BASE}/admin/stats`);
        const result = await response.json();
        
        console.log('📊 Stats API Response:', result);
        
        if (result.success) {
            const stats = result.stats;
            document.getElementById('totalBookings').textContent = stats.totalBookings || 0;
            document.getElementById('confirmedBookings').textContent = stats.confirmedBookings || 0;
            document.getElementById('pendingBookings').textContent = stats.pendingBookings || 0;
            document.getElementById('activeBookings').textContent = stats.activeBookings || 0;
            document.getElementById('totalRevenue').textContent = `₹${(stats.totalRevenue || 0).toLocaleString()}`;
            document.getElementById('todaysBookings').textContent = stats.todaysBookings || 0;
            
            console.log('✅ Dashboard statistics loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load statistics');
        }
    } catch (error) {
        console.error('❌ Error loading stats:', error);
        showNotification('Error loading dashboard statistics: ' + error.message, 'error');
        
        // Set default values if API fails
        document.getElementById('totalBookings').textContent = '0';
        document.getElementById('confirmedBookings').textContent = '0';
        document.getElementById('pendingBookings').textContent = '0';
        document.getElementById('activeBookings').textContent = '0';
        document.getElementById('totalRevenue').textContent = '₹0';
        document.getElementById('todaysBookings').textContent = '0';
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
        displayRecentBookings([]);
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
                            <div style="font-size: 0.9rem; color: #64748b;">Dates</div>
                            <div style="font-weight: 500;">${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</div>
                        </div>
                        <div class="booking-price">₹${booking.totalPrice || 0}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load all bookings with proper filters
async function loadAllBookings() {
    try {
        console.log('📋 Loading all bookings with filters...');
        showLoading('allBookingsList', 'Loading customer bookings...');
        
        const statusFilter = document.getElementById('statusFilter')?.value;
        const dateFilter = document.getElementById('dateFilter')?.value;
        
        let url = `${API_BASE}/admin/bookings`;
        const params = new URLSearchParams();
        
        // Add filters only if they have values
        if (statusFilter && statusFilter !== 'all') {
            params.append('status', statusFilter);
        }
        
        if (dateFilter) {
            params.append('date', dateFilter);
        }
        
        // Always add limit
        params.append('limit', '100');
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        console.log('📡 Fetching bookings with filters:', { statusFilter, dateFilter, url });
        
        const response = await mobileFetch(url);
        const result = await response.json();
        
        console.log('📋 Filtered Bookings API Response:', result);
        
        if (result.success) {
            displayAllBookings(result.bookings);
            console.log(`✅ Loaded ${result.bookings.length} bookings with filters: status=${statusFilter || 'all'}, date=${dateFilter || 'all'}`);
        } else {
            throw new Error(result.message || 'Failed to load bookings');
        }
    } catch (error) {
        console.error('❌ Error loading all bookings:', error);
        showNotification('Error loading bookings: ' + error.message, 'error');
        document.getElementById('allBookingsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Bookings</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadAllBookings()">Try Again</button>
            </div>
        `;
    }
}


// Display all bookings in table with filter info
function displayAllBookings(bookings) {
    const container = document.getElementById('allBookingsList');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-calendar-times"></i>
                <h3>No Bookings Found</h3>
                <p>No bookings match your current filters. Try changing your filter criteria.</p>
                <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
            </div>
        `;
        return;
    }
    
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    
    let filterInfo = '';
    if (statusFilter !== 'all' || dateFilter !== 'all') {
        filterInfo = `
            <div style="background: #f0f9ff; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem; border-left: 4px solid #3b82f6;">
                <div style="display: flex; align-items: center; gap: 0.5rem; color: #0369a1;">
                    <i class="fas fa-filter"></i>
                    <strong>Active Filters:</strong>
                    ${statusFilter !== 'all' ? `<span class="status-badge ${statusFilter}">${statusFilter}</span>` : ''}
                    ${dateFilter !== 'all' ? `<span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${getDateFilterLabel(dateFilter)}</span>` : ''}
                    <button onclick="clearFilters()" style="margin-left: auto; background: none; border: none; color: #0369a1; cursor: pointer;">
                        <i class="fas fa-times"></i> Clear
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = filterInfo + `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Contact</th>
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
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail"><i class="fas fa-phone"></i> ${booking.user?.phone || 'N/A'}</div>
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
                            <td><strong>₹${booking.totalPrice || 0}</strong></td>
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
            ${statusFilter !== 'all' ? ` • Filtered by: ${statusFilter}` : ''}
            ${dateFilter !== 'all' ? ` • Date: ${getDateFilterLabel(dateFilter)}` : ''}
        </div>
    `;
}

// Helper function to get date filter label
function getDateFilterLabel(dateFilter) {
    const labels = {
        'today': 'Today',
        'week': 'Last 7 Days',
        'month': 'Last 30 Days',
        'year': 'Last Year',
        'all': 'All Time'
    };
    return labels[dateFilter] || dateFilter;
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
        document.getElementById('customersList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Customers</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadCustomers()">Try Again</button>
            </div>
        `;
    }
}

// Display customers with enhanced details
function displayCustomers(users) {
    const container = document.getElementById('customersList');
    
    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users-slash"></i>
                <h3>No Customers Found</h3>
                <p>No customers match your current search.</p>
            </div>
        `;
        return;
    }
    
    // Filter only regular users (non-admins)
    const customerUsers = users.filter(user => user.role === 'user');
    
    if (customerUsers.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users"></i>
                <h3>No Customers Found</h3>
                <p>Only admin accounts exist in the system.</p>
            </div>
        `;
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isPermanentAdmin = currentUser.email === 'ramanaidupalla359@gmail.com';

    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Contact Information</th>
                        <th>Total Bookings</th>
                        <th>Total Spent (₹)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${customerUsers.map(customer => {
                        const totalBookings = customer.bookingCount || 0;
                        const totalSpent = customer.totalSpent || 0;
                        
                        return `
                        <tr>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${customer.name}</div>
                                    <div class="customer-detail">Joined: ${new Date(customer.createdAt).toLocaleDateString()}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail"><i class="fas fa-envelope"></i> ${customer.email}</div>
                                    <div class="customer-detail"><i class="fas fa-phone"></i> ${customer.phone || 'Not provided'}</div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge" style="background: #3b82f6; color: white; font-size: 0.9rem;">
                                    ${totalBookings}
                                </span>
                            </td>
                            <td>
                                <strong style="color: #059669; font-size: 1.1rem;">₹${totalSpent.toLocaleString()}</strong>
                            </td>
                            <td>
                                <span class="status-badge ${customer.isActive ? 'active' : 'cancelled'}">
                                    ${customer.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-view" onclick="viewCustomerDetails('${customer._id}')">
                                        <i class="fas fa-eye"></i> View Details
                                    </button>
                                    ${isPermanentAdmin ? `
                                        <button class="btn-toggle-availability" onclick="makeUserAdmin('${customer._id}', '${customer.name}')" style="margin-left: 0.5rem;">
                                            <i class="fas fa-user-shield"></i> Make Admin
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
        <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
            Showing ${customerUsers.length} customers
        </div>
    `;
}

// View customer details - FIXED VERSION
async function viewCustomerDetails(userId) {
    try {
        console.log(`👤 Viewing customer details: ${userId}`);
        
        const response = await mobileFetch(`${API_BASE}/admin/users/${userId}`);
        const result = await response.json();
        
        if (result.success) {
            displayCustomerDetails(result.user);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error loading customer details:', error);
        showNotification('Error loading customer details: ' + error.message, 'error');
    }
}

// Display customer details with dark text
function displayCustomerDetails(user) {
    const modal = document.getElementById('customerDetailsModal');
    const content = document.getElementById('customerDetailsContent');
    
    // Get user's bookings for detailed history
    loadCustomerBookings(user._id).then(bookings => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isPermanentAdmin = currentUser.email === 'ramanaidupalla359@gmail.com';

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                    <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-user" style="color: #3b82f6;"></i> Customer Information
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Name:</span>
                            <span>${user.name || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Email:</span>
                            <span>${user.email || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Phone:</span>
                            <span>${user.phone || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Role:</span>
                            <span class="status-badge ${user.role}">${user.role}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Member Since:</span>
                            <span>${new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                        ${user.address ? `
                            <div style="display: flex; justify-content: space-between;">
                                <span style="font-weight: 600; color: #475569;">Address:</span>
                                <span style="text-align: right;">${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                    <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-chart-bar" style="color: #10b981;"></i> Booking Statistics
                    </h4>
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Total Bookings:</span>
                            <span style="font-weight: bold;">${user.stats?.totalBookings || 0}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Total Spent:</span>
                            <span style="font-weight: bold; color: #059669;">₹${(user.stats?.totalSpent || 0).toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: 600; color: #475569;">Account Status:</span>
                            <span class="status-badge ${user.isActive ? 'active' : 'cancelled'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    
                    ${isPermanentAdmin ? `
                        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                            <button class="btn btn-primary" onclick="makeUserAdmin('${user._id}', '${user.name}')" style="width: 100%;">
                                <i class="fas fa-user-shield"></i> Make Admin
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; grid-column: 1 / -1;">
                    <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-history" style="color: #f59e0b;"></i> Booking History
                    </h4>
                    ${bookings.length > 0 ? `
                        <div style="overflow-x: auto;">
                            <table class="bookings-table">
                                <thead>
                                    <tr>
                                        <th>Car</th>
                                        <th>Dates</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Booked On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bookings.map(booking => `
                                        <tr>
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
                                            <td><strong>₹${booking.totalPrice || 0}</strong></td>
                                            <td>
                                                <span class="status-badge ${booking.status}">${booking.status}</span>
                                            </td>
                                            <td>${new Date(booking.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 2rem; color: #64748b;">
                            <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                            <p>No booking history found for this customer.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    });

    modal.style.display = 'block';
}

// Load customer bookings for details
async function loadCustomerBookings(userId) {
    try {
        const response = await mobileFetch(`${API_BASE}/admin/bookings?limit=50`);
        const result = await response.json();
        
        if (result.success) {
            // Filter bookings for this specific user
            const userBookings = result.bookings.filter(booking => 
                booking.user && booking.user._id === userId
            );
            return userBookings;
        }
        return [];
    } catch (error) {
        console.error('Error loading customer bookings:', error);
        return [];
    }
}

// Make user admin (no password required)
async function makeUserAdmin(userId, userName) {
    if (!isPermanentAdmin()) {
        showNotification('Only permanent admin can make users admin.', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to make "${userName}" an admin?`)) {
        return;
    }

    try {
        const response = await mobileFetch(`${API_BASE}/admin/users/${userId}/make-admin`, {
            method: 'PUT',
            body: JSON.stringify({})
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`"${userName}" has been made admin successfully!`, 'success');
            closeModal('customerDetailsModal');
            loadCustomers();
            loadAdmins();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error making user admin:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Check if current user is permanent admin
function isPermanentAdmin() {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const permanentAdmins = [
        'ramanaidupalla359@gmail.com',
        'nleelasairamnakka@gmail.com'
    ];
    return permanentAdmins.includes(currentUser.email);
}

// Load admin users
async function loadAdmins() {
    try {
        console.log('👑 Loading admin accounts...');
        showLoading('adminsList', 'Loading admin accounts...');
        
        const response = await mobileFetch(`${API_BASE}/admin/users`);
        const result = await response.json();
        
        if (result.success) {
            displayAdmins(result.users);
            console.log('✅ Admin accounts loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load admin accounts');
        }
    } catch (error) {
        console.error('❌ Error loading admin accounts:', error);
        showNotification('Error loading admin accounts: ' + error.message, 'error');
        document.getElementById('adminsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Admins</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadAdmins()">Try Again</button>
            </div>
        `;
    }
}

// Display admin accounts
function displayAdmins(users) {
    const container = document.getElementById('adminsList');
    
    // Filter only admin users
    const adminUsers = users.filter(user => user.role === 'admin');
    
    if (adminUsers.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-shield"></i>
                <h3>No Admin Accounts</h3>
                <p>No admin accounts found in the system.</p>
            </div>
        `;
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isCurrentUserPermanentAdmin = isPermanentAdmin(); // Use the function

    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>Admin Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Account Created</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${adminUsers.map(admin => {
                        const permanentAdmins = [
                            'ramanaidupalla359@gmail.com',
                            'nleelasairamnakka@gmail.com'
                        ];
                        const isPermanentAdminAccount = permanentAdmins.includes(admin.email);
                        return `
                        <tr>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">
                                        ${admin.name} 
                                        ${isPermanentAdminAccount ? ' 👑' : ''}
                                    </div>
                                    <div class="customer-detail">${isPermanentAdminAccount ? 'Permanent Admin' : 'Admin User'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail"><i class="fas fa-envelope"></i> ${admin.email}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail">${admin.phone || 'Not provided'}</div>
                                </div>
                            </td>
                            <td>${new Date(admin.createdAt).toLocaleDateString()}</td>
                            <td>
                                <span class="status-badge ${isPermanentAdminAccount ? 'active' : 'confirmed'}">
                                    ${isPermanentAdminAccount ? 'Permanent' : 'Admin'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-view" onclick="viewCustomerDetails('${admin._id}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    ${!isPermanentAdminAccount && isCurrentUserPermanentAdmin ? `
                                        <button class="btn-remove-car" onclick="demoteAdmin('${admin._id}', '${admin.name}')" style="margin-left: 0.5rem;">
                                            <i class="fas fa-user-minus"></i> Demote
                                        </button>
                                    ` : `
                                        ${isPermanentAdminAccount ? `
                                            <span style="color: #6b7280; font-size: 0.8rem; padding: 0.4rem 0.8rem; background: #f3f4f6; border-radius: 4px;">
                                                <i class="fas fa-lock"></i> Permanent
                                            </span>
                                        ` : ''}
                                    `}
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
        <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
            Showing ${adminUsers.length} admin accounts • Permanent admins: ramanaidupalla359@gmail.com, nleelasairamnakka@gmail.com
        </div>
    `;
}

// Load all cars for management with proper filtering
async function loadAllCars() {
    try {
        console.log('🚗 Loading all cars for management...');
        showLoading('carsList', 'Loading cars...');
        
        const statusFilter = document.getElementById('carStatusFilter')?.value;
        
        const response = await mobileFetch(`${API_BASE}/admin/cars`);
        const result = await response.json();

        if (result.success) {
            let cars = result.cars;
            
            // Apply availability filter
            if (statusFilter === 'available') {
                cars = cars.filter(car => car.available === true);
            } else if (statusFilter === 'unavailable') {
                cars = cars.filter(car => car.available === false);
            }
            
            displayCars(cars);
            console.log(`✅ Loaded ${cars.length} cars with filter: ${statusFilter || 'all'}`);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error loading cars:', error);
        showNotification('Error loading cars: ' + error.message, 'error');
        document.getElementById('carsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Cars</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadAllCars()">Try Again</button>
            </div>
        `;
    }
}

// Display cars with edit functionality
function displayCars(cars) {
    const container = document.getElementById('carsList');
    
    if (!cars || cars.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-car"></i>
                <h3>No Cars Found</h3>
                <p>No cars found in the system.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="cars-grid-admin">
            ${cars.map(car => `
                <div class="car-card-admin ${!car.available ? 'unavailable' : ''}">
                    <img src="${car.images && car.images.length > 0 ? car.images[0].url : 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" 
                         alt="${car.make} ${car.model}" 
                         class="car-image-admin">
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
                            <button class="btn-edit-car" onclick="editCar('${car._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
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
            Showing ${cars.length} cars
        </div>
    `;
}

// Load enhanced reports with comprehensive analytics
async function loadReports() {
    try {
        console.log('📈 Loading enhanced reports...');
        showLoading('reportsContent', 'Generating comprehensive reports...');
        
        const period = document.getElementById('reportPeriod')?.value || '30';
        
        const response = await mobileFetch(`${API_BASE}/admin/reports?period=${period}`);
        const result = await response.json();
        
        console.log('📈 Enhanced Reports API Response:', result);
        
        if (result.success) {
            displayEnhancedReports(result.reports);
            console.log('✅ Enhanced reports loaded successfully');
        } else {
            throw new Error(result.message || 'Failed to load reports');
        }
    } catch (error) {
        console.error('❌ Error loading enhanced reports:', error);
        showNotification('Error loading enhanced reports: ' + error.message, 'error');
        document.getElementById('reportsContent').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Reports</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadReports()">Try Again</button>
            </div>
        `;
    }
}

// Display enhanced reports with comprehensive analytics
function displayEnhancedReports(reports) {
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
    
    // Calculate additional metrics
    const totalCancellations = reports.summary?.revenueByStatus?.cancelled?.count || 0;
    const cancellationRate = reports.summary?.totalBookings ? 
        ((totalCancellations / reports.summary.totalBookings) * 100).toFixed(1) : 0;
    
    const avgBookingValue = reports.summary?.totalBookings ? 
        (reports.summary.totalRevenue / reports.summary.totalBookings).toFixed(0) : 0;

    let reportsHTML = `
        <!-- Key Metrics Cards -->
        <div class="reports-grid">
            <div class="report-card revenue">
                <h4><i class="fas fa-rupee-sign"></i> Total Revenue</h4>
                <div class="report-value revenue">₹${(reports.summary?.totalRevenue || 0).toLocaleString()}</div>
                <div class="report-change">
                    <i class="fas fa-chart-line"></i>
                    From ${reports.summary?.totalBookings || 0} successful bookings
                </div>
                <div class="report-change">
                    Avg: ₹${avgBookingValue} per booking
                </div>
            </div>
            
            <div class="report-card bookings">
                <h4><i class="fas fa-calendar-check"></i> Total Bookings</h4>
                <div class="report-value bookings">${(reports.summary?.totalBookings || 0).toLocaleString()}</div>
                <div class="report-change">
                    <i class="fas fa-chart-pie"></i>
                    Excluding cancelled bookings
                </div>
                <div class="report-change">
                    Period: ${reports.period} days
                </div>
            </div>
            
            <div class="report-card customers">
                <h4><i class="fas fa-users"></i> Active Customers</h4>
                <div class="report-value customers">${reports.topCustomers ? reports.topCustomers.length : 0}</div>
                <div class="report-change">
                    <i class="fas fa-user-check"></i>
                    Customers with successful bookings
                </div>
                <div class="report-change">
                    Top spender: ₹${reports.topCustomers && reports.topCustomers[0] ? reports.topCustomers[0].totalSpent.toLocaleString() : 0}
                </div>
            </div>
            
            <div class="report-card cancellations">
                <h4><i class="fas fa-times-circle"></i> Cancellations</h4>
                <div class="report-value cancellations">${totalCancellations}</div>
                <div class="report-change">
                    <i class="fas fa-percentage"></i>
                    Cancellation rate: ${cancellationRate}%
                </div>
                <div class="report-change">
                    ${reports.summary?.revenueByStatus?.cancelled ? `Lost revenue: ₹${reports.summary.revenueByStatus.cancelled.revenue.toLocaleString()}` : 'No revenue loss'}
                </div>
            </div>
        </div>
    `;
    
    reportsHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">';
    
    // Revenue by Car Type
    if (reports.revenueByCarType && reports.revenueByCarType.length > 0) {
        const totalRevenue = reports.revenueByCarType.reduce((sum, type) => sum + type.revenue, 0);
        
        reportsHTML += `
            <div class="chart-container">
                <h4><i class="fas fa-car-side"></i> Revenue by Car Type</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${reports.revenueByCarType.map(type => {
                        const percentage = totalRevenue ? ((type.revenue / totalRevenue) * 100).toFixed(1) : 0;
                        return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                                <span style="font-weight: 600; color: #111827;">${type._id}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #111827; font-size: 1.1rem;">₹${type.revenue.toLocaleString()}</div>
                                <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">
                                    ${type.bookings} bookings • ${percentage}%
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }
    
    // Popular Cars by Revenue
    if (reports.popularCars && reports.popularCars.length > 0) {
        reportsHTML += `
            <div class="chart-container">
                <h4><i class="fas fa-trophy"></i> Top Performing Cars</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${reports.popularCars.slice(0, 5).map((car, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f8fafc; border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 24px; height: 24px; background: #f59e0b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.7rem;">
                                    ${index + 1}
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${car.make} ${car.model}</div>
                                    <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">${car.type} • ${car.bookings} bookings</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #059669; font-size: 1.1rem;">₹${car.revenue.toLocaleString()}</div>
                                <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">
                                    ₹${car.bookings ? Math.round(car.revenue / car.bookings).toLocaleString() : 0}/booking
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Top Customers by Spending
    if (reports.topCustomers && reports.topCustomers.length > 0) {
        reportsHTML += `
            <div class="chart-container" style="grid-column: 1 / -1;">
                <h4><i class="fas fa-crown"></i> Top Customers by Spending</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
                    ${reports.topCustomers.slice(0, 8).map((customer, index) => `
                        <div style="padding: 1.25rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <div style="width: 24px; height: 24px; background: #f59e0b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.7rem;">
                                            ${index + 1}
                                        </div>
                                        <div style="font-weight: 700; color: #111827; font-size: 1.1rem;">${customer.name}</div>
                                    </div>
                                    <div style="font-size: 0.9rem; color: #374151; font-weight: 500;">${customer.email}</div>
                                    <div style="font-size: 0.85rem; color: #6b7280;">${customer.phone}</div>
                                </div>
                                <div style="background: #3b82f6; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                                    ${customer.successfulBookings} ${customer.successfulBookings === 1 ? 'booking' : 'bookings'}
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 0.9rem; color: #374151; font-weight: 500;">Total Spent:</span>
                                <span style="font-weight: bold; color: #059669; font-size: 1.1rem;">₹${customer.totalSpent.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                                <span style="font-size: 0.85rem; color: #6b7280;">Avg per booking:</span>
                                <span style="font-weight: 600; color: #374151; font-size: 0.9rem;">
                                    ₹${customer.successfulBookings ? Math.round(customer.totalSpent / customer.successfulBookings).toLocaleString() : 0}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Booking Trends
    if (reports.bookingTrends && reports.bookingTrends.length > 0) {
        const totalTrendBookings = reports.bookingTrends.reduce((sum, trend) => sum + trend.count, 0);
        const totalTrendRevenue = reports.bookingTrends.reduce((sum, trend) => sum + trend.revenue, 0);
        
        reportsHTML += `
            <div class="chart-container" style="grid-column: 1 / -1;">
                <h4><i class="fas fa-chart-line"></i> Booking Trends (Last ${reports.period} Days)</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #0369a1; font-weight: 600;">Total in Period</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #111827;">${totalTrendBookings} bookings</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #0369a1; font-weight: 600;">Revenue in Period</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #111827;">₹${totalTrendRevenue.toLocaleString()}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #0369a1; font-weight: 600;">Daily Average</div>
                        <div style="font-size: 1.25rem; font-weight: 700; color: #111827;">${Math.round(totalTrendBookings / reports.bookingTrends.length)} bookings</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.75rem;">
                    ${reports.bookingTrends.slice(-14).map(trend => {
                        const date = new Date(trend._id);
                        const isToday = new Date().toDateString() === date.toDateString();
                        return `
                        <div style="text-align: center; padding: 1rem; background: ${isToday ? '#dbeafe' : '#f8fafc'}; border-radius: 6px; border: ${isToday ? '2px solid #3b82f6' : '1px solid #e2e8f0'};">
                            <div style="font-weight: 600; color: #111827; margin-bottom: 0.5rem; font-size: 0.9rem;">
                                ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                ${isToday ? ' ⭐' : ''}
                            </div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.25rem;">${trend.count}</div>
                            <div style="font-size: 0.85rem; color: #374151; font-weight: 500;">₹${trend.revenue.toLocaleString()}</div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }
    
    // Cancellation Analysis
    if (reports.summary?.revenueByStatus) {
        const statusData = reports.summary.revenueByStatus;
        const statuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
        
        reportsHTML += `
            <div class="chart-container" style="grid-column: 1 / -1;">
                <h4><i class="fas fa-chart-pie"></i> Booking Status Distribution</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${statuses.map(status => {
                        const data = statusData[status];
                        if (!data) return '';
                        
                        const statusColors = {
                            'pending': '#f59e0b',
                            'confirmed': '#3b82f6', 
                            'active': '#8b5cf6',
                            'completed': '#10b981',
                            'cancelled': '#ef4444'
                        };
                        
                        const statusLabels = {
                            'pending': 'Pending',
                            'confirmed': 'Confirmed',
                            'active': 'Active',
                            'completed': 'Completed',
                            'cancelled': 'Cancelled'
                        };
                        
                        return `
                        <div style="text-align: center; padding: 1.5rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid ${statusColors[status]}">
                            <div style="font-weight: 600; color: #111827; margin-bottom: 0.5rem;">${statusLabels[status]}</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: ${statusColors[status]}; margin-bottom: 0.25rem;">
                                ${data.count || 0}
                            </div>
                            <div style="font-size: 0.9rem; color: #374151; font-weight: 500;">
                                ₹${(data.revenue || 0).toLocaleString()}
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    }
    
    reportsHTML += '</div>';
    container.innerHTML = reportsHTML;
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
    if (!carData.make || !carData.model || !carData.type) {
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
            document.getElementById('addCarForm').reset();
            loadAllCars();
            console.log('✅ Car added successfully');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error adding car:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Enhanced Car Editing Functions
async function editCar(carId) {
    try {
        console.log(`✏️ Editing car: ${carId}`);
        
        const response = await mobileFetch(`${API_BASE}/admin/cars/${carId}`);
        const result = await response.json();
        
        if (result.success) {
            displayCarEditForm(result.car);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error loading car for editing:', error);
        showNotification('Error loading car details: ' + error.message, 'error');
    }
}

function displayCarEditForm(car) {
    const modal = document.getElementById('carEditModal') || createCarEditModal();
    
    document.getElementById('editCarId').value = car._id;
    document.getElementById('editCarMake').value = car.make || '';
    document.getElementById('editCarModel').value = car.model || '';
    document.getElementById('editCarYear').value = car.year || 2024;
    document.getElementById('editCarType').value = car.type || '';
    document.getElementById('editCarSeats').value = car.seats || 5;
    document.getElementById('editCarFuelType').value = car.fuelType || '';
    document.getElementById('editCarTransmission').value = car.transmission || '';
    document.getElementById('editCarPricePerDay').value = car.pricePerDay || '';
    document.getElementById('editCarPricePerHour').value = car.pricePerHour || '';
    document.getElementById('editCarColor').value = car.color || '';
    document.getElementById('editCarMileage').value = car.mileage || '';
    document.getElementById('editCarFeatures').value = car.features ? car.features.join(', ') : '';
    document.getElementById('editCarImageUrl').value = car.images && car.images.length > 0 ? car.images[0].url : '';
    document.getElementById('editCarRegistration').value = car.registrationNumber || '';
    document.getElementById('editCarAvailable').checked = car.available !== false;
    
    // Update preview
    updateCarImagePreview(car.images && car.images.length > 0 ? car.images[0].url : '');
    
    modal.style.display = 'block';
}

function createCarEditModal() {
    const modal = document.createElement('div');
    modal.id = 'carEditModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Car</h3>
                <span class="close" onclick="closeModal('carEditModal')">&times;</span>
            </div>
            <div class="modal-body">
                <form id="editCarForm">
                    <input type="hidden" id="editCarId">
                    
                    <div class="form-section">
                        <h4><i class="fas fa-car"></i> Car Information</h4>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="editCarMake">Company/Make *</label>
                                <input type="text" id="editCarMake" required>
                            </div>
                            <div class="form-group">
                                <label for="editCarModel">Model *</label>
                                <input type="text" id="editCarModel" required>
                            </div>
                        </div>
                        
                        <div class="form-grid-3">
                            <div class="form-group">
                                <label for="editCarYear">Year *</label>
                                <input type="number" id="editCarYear" required min="2010" max="2024">
                            </div>
                            <div class="form-group">
                                <label for="editCarType">Type *</label>
                                <select id="editCarType" required>
                                    <option value="">Select Type</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Sedan">Sedan</option>
                                    <option value="Hatchback">Hatchback</option>
                                    <option value="MPV">MPV</option>
                                    <option value="Luxury">Luxury</option>
                                    <option value="Sports">Sports</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editCarSeats">Seats *</label>
                                <input type="number" id="editCarSeats" required min="2" max="9">
                            </div>
                        </div>
                        
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="editCarFuelType">Fuel Type *</label>
                                <select id="editCarFuelType" required>
                                    <option value="">Select Fuel Type</option>
                                    <option value="Petrol">Petrol</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Electric">Electric</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editCarTransmission">Transmission *</label>
                                <select id="editCarTransmission" required>
                                    <option value="">Select Transmission</option>
                                    <option value="Manual">Manual</option>
                                    <option value="Automatic">Automatic</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4><i class="fas fa-rupee-sign"></i> Pricing</h4>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="editCarPricePerDay">Price Per Day (₹) *</label>
                                <input type="number" id="editCarPricePerDay" required min="500" step="100">
                            </div>
                            <div class="form-group">
                                <label for="editCarPricePerHour">Price Per Hour (₹) *</label>
                                <input type="number" id="editCarPricePerHour" required min="50" step="50">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4><i class="fas fa-palette"></i> Appearance & Details</h4>
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="editCarColor">Color</label>
                                <input type="text" id="editCarColor" placeholder="e.g., Red, White">
                            </div>
                            <div class="form-group">
                                <label for="editCarMileage">Mileage</label>
                                <input type="text" id="editCarMileage" placeholder="e.g., 15 kmpl">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editCarFeatures">Features (comma separated)</label>
                            <input type="text" id="editCarFeatures" placeholder="e.g., AC, Music System, Sunroof">
                        </div>
                        
                        <div class="form-group">
                            <label for="editCarRegistration">Registration Number</label>
                            <input type="text" id="editCarRegistration" placeholder="e.g., TS09AB1234">
                        </div>
                        
                        <div class="form-group">
                            <label for="editCarAvailable" style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" id="editCarAvailable" checked>
                                Available for booking
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4><i class="fas fa-image"></i> Car Image</h4>
                        <div class="form-group">
                            <label for="editCarImageUrl">Image URL *</label>
                            <input type="url" id="editCarImageUrl" required 
                                   oninput="updateCarImagePreview(this.value)"
                                   placeholder="https://example.com/car-image.jpg">
                            <small style="color: #64748b; font-size: 0.8rem;">Provide a direct image URL</small>
                        </div>
                        
                        <div id="carImagePreviewContainer" style="text-align: center; margin: 1rem 0;">
                            <img id="carImagePreview" src="" alt="Car Preview" 
                                 style="max-width: 300px; max-height: 200px; border-radius: 8px; display: none;">
                            <div id="carImagePreviewPlaceholder" style="color: #64748b; font-style: italic;">
                                Image preview will appear here
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('carEditModal')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add form submission handler
    document.getElementById('editCarForm').addEventListener('submit', handleEditCarForm);
    
    return modal;
}

// Update car image preview
function updateCarImagePreview(imageUrl) {
    const preview = document.getElementById('carImagePreview');
    const placeholder = document.getElementById('carImagePreviewPlaceholder');
    
    if (imageUrl && imageUrl.startsWith('http')) {
        preview.src = imageUrl;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Handle image loading errors
        preview.onerror = function() {
            this.style.display = 'none';
            placeholder.style.display = 'block';
            placeholder.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load image. Please check the URL.</p>
            `;
        };
        
        // Handle image loading success
        preview.onload = function() {
            this.style.display = 'block';
            placeholder.style.display = 'none';
        };
    } else {
        preview.style.display = 'none';
        placeholder.style.display = 'block';
        placeholder.innerHTML = `
            <i class="fas fa-car"></i>
            <p>Car preview will appear here</p>
        `;
    }
}

async function handleEditCarForm(e) {
    e.preventDefault();
    
    const carData = {
        make: document.getElementById('editCarMake').value.trim(),
        model: document.getElementById('editCarModel').value.trim(),
        year: parseInt(document.getElementById('editCarYear').value),
        type: document.getElementById('editCarType').value,
        seats: parseInt(document.getElementById('editCarSeats').value),
        fuelType: document.getElementById('editCarFuelType').value,
        transmission: document.getElementById('editCarTransmission').value,
        pricePerDay: parseInt(document.getElementById('editCarPricePerDay').value),
        pricePerHour: parseInt(document.getElementById('editCarPricePerHour').value),
        color: document.getElementById('editCarColor').value.trim(),
        mileage: document.getElementById('editCarMileage').value.trim(),
        features: document.getElementById('editCarFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        images: [{ 
            url: document.getElementById('editCarImageUrl').value.trim(),
            alt: `${document.getElementById('editCarMake').value.trim()} ${document.getElementById('editCarModel').value.trim()}`
        }],
        registrationNumber: document.getElementById('editCarRegistration').value.trim(),
        available: document.getElementById('editCarAvailable').checked
    };

    const carId = document.getElementById('editCarId').value;

    // Validate required fields
    if (!carData.make || !carData.model || !carData.type) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    if (carData.pricePerDay <= 0 || carData.pricePerHour <= 0) {
        showNotification('Price must be greater than 0', 'error');
        return;
    }

    try {
        const response = await mobileFetch(`${API_BASE}/admin/cars/${carId}`, {
            method: 'PUT',
            body: JSON.stringify(carData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Car updated successfully!', 'success');
            closeModal('carEditModal');
            loadAllCars(); // Refresh cars list
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error updating car:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Toggle car availability
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
            loadAllCars();
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
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error removing car:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Demote admin to regular user
async function demoteAdmin(userId, userName) {
    if (!confirm(`Are you sure you want to demote "${userName}" from admin to regular user?`)) {
        return;
    }

    try {
        console.log(`👤 Demoting admin ${userId} to user...`);
        
        const response = await mobileFetch(`${API_BASE}/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ role: 'user' })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`"${userName}" has been demoted to regular user successfully!`, 'success');
            loadAdmins();
            loadCustomers();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error demoting admin:', error);
        showNotification('Error: ' + error.message, 'error');
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
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Address:</span>
                        <span style="text-align: right;">${booking.user?.address ? `${booking.user.address.street || ''}, ${booking.user.address.city || ''}, ${booking.user.address.state || ''}` : 'N/A'}</span>
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
    
    document.getElementById('bookingDetailsModal').style.display = 'block';
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

// Clear all filters and reload
function clearFilters() {
    console.log('🔄 Clearing all filters...');
    
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    if (statusFilter) statusFilter.value = 'all';
    if (dateFilter) dateFilter.value = 'all';
    
    loadAllBookings();
    showNotification('Filters cleared successfully', 'success');
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
        
        /* Edit Car Button */
        .btn-edit-car {
            background: #f59e0b;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background 0.2s ease;
            flex: 1;
        }

        .btn-edit-car:hover {
            background: #d97706;
        }

        /* Car Actions Layout */
        .car-actions-admin {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .car-actions-admin button {
            flex: 1;
            min-width: 80px;
        }

        /* Modal Styles */
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
            background: #f8fafc;
        }

        .modal-header h3 {
            margin: 0;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .modal-body {
            padding: 1.5rem;
        }

        .form-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .form-section h4 {
            margin: 0 0 1rem 0;
            color: #1e293b;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        /* Form Grid Layouts */
        .form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
        }

        @media (max-width: 768px) {
            .form-grid-2,
            .form-grid-3 {
                grid-template-columns: 1fr;
            }
            
            .car-actions-admin {
                flex-direction: column;
            }
            
            .car-actions-admin button {
                min-width: auto;
            }
        }
    </style>
`);







// Update the displayReviewDetails function for better appearance
function displayReviewDetails(review) {
    const container = document.getElementById('reviewDetailsContent');
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const timeAgo = getTimeAgo(review.createdAt);
    
    container.innerHTML = `
        <div class="review-details-header" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 2rem; border-radius: 16px 16px 0 0; margin: -1.5rem -1.5rem 2rem -1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: 700;">Review Details</h2>
                    <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">ID: ${review._id}</p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 2.5rem; color: #ffc107; margin-bottom: 0.5rem;">${stars}</div>
                    <div style="font-weight: 700; font-size: 1.1rem;">${review.rating}.0/5.0</div>
                </div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div class="form-section" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h4 style="color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 0.5rem;">
                    <i class="fas fa-user" style="color: #3b82f6;"></i> User Information
                </h4>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <div class="info-item">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${review.user?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${review.user?.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${review.user?.phone || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="form-section" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h4 style="color: #1e293b; border-bottom: 3px solid #f59e0b; padding-bottom: 0.5rem;">
                    <i class="fas fa-star" style="color: #f59e0b;"></i> Review Information
                </h4>
                <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                    <div class="info-item">
                        <span class="info-label">Type:</span>
                        <span class="info-value">
                            <span class="status-badge ${review.type}">${review.type}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">
                            <span class="status-badge ${review.status}">${review.status}</span>
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Helpful Count:</span>
                        <span class="info-value" style="color: #059669; font-weight: 700;">${review.helpfulCount || 0}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Report Count:</span>
                        <span class="info-value" style="color: ${review.reportCount > 0 ? '#ef4444' : '#059669'}; font-weight: 700;">${review.reportCount}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Submitted:</span>
                        <span class="info-value">${timeAgo}</span>
                    </div>
                    ${review.isVerified ? `
                    <div class="info-item">
                        <span class="info-label">Verified:</span>
                        <span class="info-value" style="color: #059669; font-weight: 700;">
                            <i class="fas fa-check-circle"></i> Yes
                        </span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <div class="form-section" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
            <h4 style="color: #1e293b; border-bottom: 3px solid #10b981; padding-bottom: 0.5rem;">
                <i class="fas fa-comment" style="color: #10b981;"></i> Review Content
            </h4>
            <div style="margin-top: 1rem;">
                <h3 style="color: #1e293b; font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem; padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
                    ${review.title}
                </h3>
                <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 2px solid #e2e8f0; line-height: 1.7;">
                    <p style="margin: 0; color: #374151; font-size: 1rem; font-weight: 500;">${review.comment}</p>
                </div>
                <div style="margin-top: 1rem; font-size: 0.9rem; color: #64748b; font-weight: 600;">
                    <i class="fas fa-calendar"></i> Submitted: ${new Date(review.createdAt).toLocaleString()}
                </div>
            </div>
        </div>
        
        ${review.type === 'car' && review.car ? `
            <div class="form-section" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 1.5rem;">
                <h4 style="color: #1e293b; border-bottom: 3px solid #8b5cf6; padding-bottom: 0.5rem;">
                    <i class="fas fa-car" style="color: #8b5cf6;"></i> Car Information
                </h4>
                <div style="display: flex; align-items: center; gap: 1.5rem; margin-top: 1rem;">
                    <img src="${review.car.images && review.car.images[0] ? review.car.images[0].url : 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'}" 
                         alt="${review.car.make} ${review.car.model}" 
                         style="width: 120px; height: 90px; object-fit: cover; border-radius: 10px; border: 3px solid #e2e8f0;">
                    <div style="flex: 1;">
                        <div style="font-weight: 700; color: #1e293b; font-size: 1.2rem; margin-bottom: 0.5rem;">${review.car.make} ${review.car.model}</div>
                        <div style="color: #374151; font-size: 0.95rem; font-weight: 600;">
                            <div>Year: ${review.car.year} • Type: ${review.car.type}</div>
                            <div>Fuel: ${review.car.fuelType} • Transmission: ${review.car.transmission}</div>
                            <div>Seats: ${review.car.seats} • Color: ${review.car.color || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${review.adminResponse ? `
            <div class="form-section" style="background: linear-gradient(135deg, #f0f9ff, #dbeafe); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 1.5rem; border-left: 4px solid #3b82f6;">
                <h4 style="color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 0.5rem;">
                    <i class="fas fa-reply" style="color: #3b82f6;"></i> Admin Response
                </h4>
                <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-top: 1rem; border: 2px solid #bfdbfe;">
                    <p style="margin: 0 0 1rem 0; line-height: 1.7; color: #374151; font-weight: 500; font-size: 1rem;">${review.adminResponse.response}</p>
                    <div style="font-size: 0.85rem; color: #64748b; font-weight: 600;">
                        <i class="fas fa-user-shield"></i> Responded on: ${new Date(review.adminResponse.respondedAt).toLocaleString()}
                    </div>
                </div>
            </div>
        ` : ''}

        <div class="form-section" style="background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h4 style="color: #1e293b; margin-bottom: 1.5rem;">Quick Actions</h4>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="verifyReview('${review._id}')" style="padding: 1rem 1.5rem; font-weight: 700; border-radius: 10px; background: linear-gradient(135deg, #10b981, #059669); border: none; color: white; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-check-circle"></i> Verify Review
                </button>
                <button class="btn btn-warning" onclick="addAdminResponse('${review._id}')" style="padding: 1rem 1.5rem; font-weight: 700; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; color: white; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-reply"></i> Add Response
                </button>
                <button class="btn btn-danger" onclick="deleteAdminReview('${review._id}')" style="padding: 1rem 1.5rem; font-weight: 700; border-radius: 10px; background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: white; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-trash"></i> Delete Review
                </button>
            </div>
        </div>
    `;
    
    // Add hover effects to buttons
    setTimeout(() => {
        document.querySelectorAll('#reviewDetailsContent .btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });
    }, 100);
    
    document.getElementById('reviewDetailsModal').style.display = 'block';
}




// Verify review - FIXED VERSION
async function verifyReview(reviewId) {
    try {
        const response = await mobileFetch(`${API_BASE}/admin/reviews/${reviewId}/verify`, {
            method: 'PUT'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            showNotification('Review verified successfully!', 'success');
            closeModal('reviewDetailsModal');
            loadAdminReviews();
        } else {
            throw new Error(result.message || 'Failed to verify review');
        }
    } catch (error) {
        console.error('❌ Error verifying review:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add admin response - FIXED VERSION
async function addAdminResponse(reviewId) {
    const responseText = prompt('Enter your response to this review:');
    if (!responseText) return;
    
    try {
        const response = await mobileFetch(`${API_BASE}/admin/reviews/${reviewId}/response`, {
            method: 'PUT',
            body: JSON.stringify({ 
                adminResponse: responseText
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            showNotification('Admin response added successfully!', 'success');
            closeModal('reviewDetailsModal');
            loadAdminReviews();
        } else {
            throw new Error(result.message || 'Failed to add admin response');
        }
    } catch (error) {
        console.error('❌ Error adding admin response:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}


// Load admin reviews - ENHANCED VERSION
async function loadAdminReviews() {
    try {
        console.log('📝 Admin: Loading reviews...');
        showLoading('adminReviewsList', 'Loading reviews...');
        
        const typeFilter = document.getElementById('reviewTypeFilterAdmin').value;
        const statusFilter = document.getElementById('reviewStatusFilterAdmin').value;
        const searchQuery = document.getElementById('reviewSearchAdmin').value;
        
        // Get reviews from the main script's storage
        let reviews = [];
        
        // Try to get reviews from localStorage first
        const savedReviews = localStorage.getItem('carRentalReviews');
        if (savedReviews) {
            try {
                reviews = JSON.parse(savedReviews);
                console.log(`📝 Admin: Loaded ${reviews.length} reviews from localStorage`);
                
                // Log review types for debugging
                const carReviews = reviews.filter(r => r.type === 'car');
                const websiteReviews = reviews.filter(r => r.type === 'website' || !r.type);
                console.log(`📝 Review Types: ${carReviews.length} Car, ${websiteReviews.length} Website`);
                
            } catch (error) {
                console.error('❌ Admin: Error loading reviews from localStorage:', error);
                reviews = [];
            }
        }
        
        // Filter reviews
        let filteredReviews = [...reviews];
        
        if (typeFilter !== 'all') {
            if (typeFilter === 'car') {
                filteredReviews = filteredReviews.filter(review => review.type === 'car');
            } else if (typeFilter === 'website') {
                // Include both 'website' type and reviews without type (legacy)
                filteredReviews = filteredReviews.filter(review => 
                    review.type === 'website' || !review.type
                );
            }
        }
        
        if (statusFilter !== 'all') {
            filteredReviews = filteredReviews.filter(review => 
                (review.status || 'active') === statusFilter
            );
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredReviews = filteredReviews.filter(review => 
                (review.user?.name || '').toLowerCase().includes(query) ||
                (review.user?.email || '').toLowerCase().includes(query) ||
                (review.title || '').toLowerCase().includes(query) ||
                (review.comment || '').toLowerCase().includes(query) ||
                (review.car?.make || '').toLowerCase().includes(query) ||
                (review.car?.model || '').toLowerCase().includes(query)
            );
        }
        
        // Calculate stats
        const stats = {
            total: reviews.length,
            car: reviews.filter(r => r.type === 'car').length,
            website: reviews.filter(r => r.type === 'website' || !r.type).length,
            flagged: reviews.filter(r => (r.reportCount || 0) > 0).length
        };
        
        displayAdminReviews(filteredReviews, stats);
        console.log(`✅ Admin: Loaded ${filteredReviews.length} filtered reviews`);
        
    } catch (error) {
        console.error('❌ Error loading admin reviews:', error);
        showNotification('Error loading reviews: ' + error.message, 'error');
        document.getElementById('adminReviewsList').innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Reviews</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="loadAdminReviews()">Try Again</button>
            </div>
        `;
    }
}

// Display admin reviews - FIXED VERSION
function displayAdminReviews(reviews, stats) {
    const container = document.getElementById('adminReviewsList');
    if (!container) return;
    
    // Update statistics
    if (stats) {
        const totalReviewsElem = document.getElementById('totalReviewsAdmin');
        const carReviewsElem = document.getElementById('carReviewsAdmin');
        const websiteReviewsElem = document.getElementById('websiteReviewsAdmin');
        const flaggedReviewsElem = document.getElementById('flaggedReviewsAdmin');
        
        if (totalReviewsElem) totalReviewsElem.textContent = stats.total || 0;
        if (carReviewsElem) carReviewsElem.textContent = stats.car || 0;
        if (websiteReviewsElem) websiteReviewsElem.textContent = stats.website || 0;
        if (flaggedReviewsElem) flaggedReviewsElem.textContent = stats.flagged || 0;
    }
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-star"></i>
                <h3>No Reviews Found</h3>
                <p>No reviews match your current filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="overflow-x: auto;">
            <table class="bookings-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Type</th>
                        <th>Rating</th>
                        <th>Title</th>
                        <th>Comment Preview</th>
                        <th>Status</th>
                        <th>Reports</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map(review => {
                        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                        const timeAgo = getTimeAgo(review.createdAt);
                        
                        // Determine review type with proper display
                        const reviewType = review.type || 'website'; // Default to website if not specified
                        const typeDisplay = reviewType === 'car' ? 'Car Review' : 'Website Review';
                        const typeIcon = reviewType === 'car' ? 'fas fa-car' : 'fas fa-globe';
                        const typeBadgeClass = reviewType === 'car' ? 'car' : 'website';
                        
                        // Get car info for car reviews
                        const carInfo = reviewType === 'car' && review.car ? 
                            `${review.car.make} ${review.car.model}` : 'N/A';
                        
                        return `
                            <tr>
                                <td>
                                    <div class="customer-info">
                                        <div class="customer-name">${review.user?.name || 'N/A'}</div>
                                        <div class="customer-detail">${review.user?.email || 'N/A'}</div>
                                        ${reviewType === 'car' ? `
                                            <div class="customer-detail" style="font-size: 0.8rem; color: #64748b;">
                                                <i class="fas fa-car"></i> ${carInfo}
                                            </div>
                                        ` : ''}
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge ${typeBadgeClass}">
                                        <i class="${typeIcon}"></i> ${typeDisplay}
                                    </span>
                                </td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="color: #ffc107; font-weight: bold;">${review.rating}</span>
                                        <div style="color: #ffc107; font-size: 0.9rem;">${stars}</div>
                                    </div>
                                </td>
                                <td>
                                    <div style="max-width: 150px;">
                                        <div style="font-weight: 500; margin-bottom: 0.25rem;">${review.title}</div>
                                    </div>
                                </td>
                                <td>
                                    <div style="max-width: 200px;">
                                        <div style="font-size: 0.8rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            ${review.comment || 'No comment provided'}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="status-badge ${review.status || 'active'}">
                                        ${review.status || 'active'}
                                    </span>
                                </td>
                                <td>
                                    <span style="font-weight: 500; color: ${(review.reportCount || 0) > 0 ? '#ef4444' : '#64748b'}">
                                        ${review.reportCount || 0}
                                    </span>
                                </td>
                                <td>
                                    <div style="font-size: 0.8rem;">
                                        <div>${timeAgo}</div>
                                        <div style="color: #64748b;">${new Date(review.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-view" onclick="showReviewDetails('${review._id}')" title="View Details">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                        <select class="status-select" onchange="updateReviewStatus('${review._id}', this.value)" title="Change Status">
                                            <option value="">Status</option>
                                            <option value="active" ${(review.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
                                            <option value="flagged" ${(review.status || 'active') === 'flagged' ? 'selected' : ''}>Flagged</option>
                                            <option value="removed" ${(review.status || 'active') === 'removed' ? 'selected' : ''}>Removed</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        <div style="padding: 1rem; text-align: center; color: #64748b; border-top: 1px solid #e2e8f0;">
            Showing ${reviews.length} reviews • 
            ${stats?.car || 0} Car Reviews • 
            ${stats?.website || 0} Website Reviews •
            ${stats?.flagged || 0} Flagged Reviews
        </div>
    `;
}

// Show review details in admin panel - ENHANCED VERSION
async function showReviewDetails(reviewId) {
    try {
        console.log(`📋 Admin: Loading review details for ${reviewId}`);
        
        // Get reviews from localStorage
        const savedReviews = localStorage.getItem('carRentalReviews');
        if (!savedReviews) {
            throw new Error('No reviews found in storage');
        }
        
        const reviews = JSON.parse(savedReviews);
        const review = reviews.find(r => r._id === reviewId);
        
        if (!review) {
            throw new Error('Review not found');
        }
        
        // Ensure review has proper type
        if (!review.type) {
            review.type = 'website'; // Set default type for legacy reviews
        }
        
        console.log(`📋 Review Details:`, {
            id: review._id,
            type: review.type,
            user: review.user?.name,
            title: review.title,
            rating: review.rating
        });
        
        displayReviewDetails(review);
        
    } catch (error) {
        console.error('❌ Error loading review details:', error);
        showNotification('Error loading review details: ' + error.message, 'error');
    }
}
// Update review status in admin panel
async function updateReviewStatus(reviewId, status) {
    if (!status || status === '') return;
    
    try {
        // Get reviews from localStorage
        const savedReviews = localStorage.getItem('carRentalReviews');
        if (!savedReviews) {
            throw new Error('No reviews found');
        }
        
        const reviews = JSON.parse(savedReviews);
        const reviewIndex = reviews.findIndex(r => r._id === reviewId);
        
        if (reviewIndex === -1) {
            throw new Error('Review not found');
        }
        
        // Update review status
        reviews[reviewIndex].status = status;
        
        // Save back to localStorage
        localStorage.setItem('carRentalReviews', JSON.stringify(reviews));
        
        showNotification(`Review status updated to ${status} successfully!`, 'success');
        loadAdminReviews();
        
    } catch (error) {
        console.error('❌ Error updating review status:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Delete review from admin panel
async function deleteAdminReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }

    try {
        // Get reviews from localStorage
        const savedReviews = localStorage.getItem('carRentalReviews');
        if (!savedReviews) {
            throw new Error('No reviews found');
        }
        
        const reviews = JSON.parse(savedReviews);
        const reviewIndex = reviews.findIndex(r => r._id === reviewId);
        
        if (reviewIndex === -1) {
            throw new Error('Review not found');
        }
        
        // Remove review
        reviews.splice(reviewIndex, 1);
        
        // Save back to localStorage
        localStorage.setItem('carRentalReviews', JSON.stringify(reviews));
        
        showNotification('Review deleted successfully!', 'success');
        closeModal('reviewDetailsModal');
        loadAdminReviews();
        
    } catch (error) {
        console.error('❌ Error deleting review:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Add this utility function to admin.js
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}











