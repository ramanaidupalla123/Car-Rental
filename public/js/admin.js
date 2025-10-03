const API_BASE = 'http://localhost:10000/api';

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Dashboard Initializing...');
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
        alert('Please login first to access admin dashboard.');
        window.location.href = 'index.html';
        return;
    }
    
    if (user.role !== 'admin') {
        alert(`Access Denied. User ${user.email} does not have admin privileges.`);
        window.location.href = 'index.html';
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
    
    console.log('✅ Admin event listeners setup complete');
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
        
        const response = await fetch(`${API_BASE}/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Stats API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
        
        const response = await fetch(`${API_BASE}/admin/bookings?limit=6`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Recent Bookings API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
                        <div><i class="fas fa-map-marker-alt"></i> ${booking.user?.address?.city || 'N/A'}</div>
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
        params.append('limit', '100'); // Load more bookings
        
        if (params.toString()) url += `?${params.toString()}`;
        
        console.log('📡 Fetching bookings from:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 All Bookings API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
                        <th>Booking ID</th>
                        <th>Customer Details</th>
                        <th>Car Details</th>
                        <th>Booking Dates</th>
                        <th>Duration</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(booking => `
                        <tr>
                            <td><small>${booking._id?.slice(-8) || 'N/A'}</small></td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${booking.user?.name || 'N/A'}</div>
                                    <div class="customer-detail">📧 ${booking.user?.email || 'N/A'}</div>
                                    <div class="customer-detail">📞 ${booking.user?.phone || 'N/A'}</div>
                                    <div class="customer-detail">🏠 ${booking.user?.address?.city || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${booking.car?.make || ''} ${booking.car?.model || ''}</div>
                                    <div class="customer-detail">${booking.car?.type || ''} • ${booking.car?.color || ''}</div>
                                    <div class="customer-detail">${booking.car?.registrationNumber || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail"><strong>Start:</strong> ${new Date(booking.startDate).toLocaleDateString()}</div>
                                    <div class="customer-detail"><strong>End:</strong> ${new Date(booking.endDate).toLocaleDateString()}</div>
                                </div>
                            </td>
                            <td>${booking.duration} ${booking.rentalType}</td>
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
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Customers API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
                        <th>Customer ID</th>
                        <th>Personal Details</th>
                        <th>Contact Information</th>
                        <th>Address</th>
                        <th>Registration Date</th>
                        <th>Total Bookings</th>
                        <th>Total Spent</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(customer => `
                        <tr>
                            <td><small>${customer._id?.slice(-8) || 'N/A'}</small></td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${customer.name}</div>
                                    <div class="customer-detail">Member since ${new Date(customer.createdAt).getFullYear()}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail">📧 ${customer.email}</div>
                                    <div class="customer-detail">📞 ${customer.phone}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail">${customer.address?.street || 'N/A'}</div>
                                    <div class="customer-detail">${customer.address?.city || ''}, ${customer.address?.state || ''}</div>
                                    <div class="customer-detail">${customer.address?.zipCode || ''}</div>
                                </div>
                            </td>
                            <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                            <td>
                                <span class="status-badge completed">${customer.bookingCount || 0} bookings</span>
                            </td>
                            <td>
                                <strong>₹${(customer.totalSpent || 0).toLocaleString()}</strong>
                            </td>
                            <td>
                                <span class="status-badge ${customer.isActive ? 'completed' : 'cancelled'}">
                                    ${customer.isActive ? 'Active' : 'Inactive'}
                                </span>
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
        
        const response = await fetch(`${API_BASE}/admin/cars`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Cars API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
                        <th>Car Image</th>
                        <th>Car Details</th>
                        <th>Specifications</th>
                        <th>Pricing</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                        <th>Availability</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${cars.map(car => `
                        <tr>
                            <td>
                                <img src="${car.images?.[0]?.url || 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                                     alt="${car.make} ${car.model}" 
                                     style="width: 60px; height: 40px; object-fit: cover; border-radius: 5px;">
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-name">${car.make} ${car.model}</div>
                                    <div class="customer-detail">${car.year} • ${car.type}</div>
                                    <div class="customer-detail">${car.registrationNumber || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail">${car.fuelType} • ${car.transmission}</div>
                                    <div class="customer-detail">${car.seats} seats • ${car.color}</div>
                                    <div class="customer-detail">${car.mileage || 'N/A'}</div>
                                </div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <div class="customer-detail">₹${car.pricePerHour}/hour</div>
                                    <div class="customer-detail">₹${car.pricePerDay}/day</div>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge completed">${car.bookingCount || 0} bookings</span>
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
        
        const response = await fetch(`${API_BASE}/admin/reports?period=${period}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Reports API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
    
    // Booking Trends Chart (simplified)
    const bookingTrendsHTML = reports.bookingTrends && reports.bookingTrends.length > 0 ? `
        <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Booking Trends (Last ${reports.period} Days)</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                ${reports.bookingTrends.slice(-7).map(day => `
                    <div style="text-align: center; padding: 1rem; background: #f8fafc; border-radius: 6px;">
                        <div style="font-size: 0.8rem; color: #64748b;">${new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style="font-size: 1.2rem; font-weight: bold; color: #3b82f6;">${day.count}</div>
                        <div style="font-size: 0.7rem; color: #10b981;">₹${day.revenue}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : `
        <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Booking Trends</h4>
            <div style="text-align: center; padding: 2rem; color: #64748b; background: #f8fafc; border-radius: 6px;">
                <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                <p>No booking data available for the selected period</p>
            </div>
        </div>
    `;
    
    // Revenue by Car Type
    const revenueByTypeHTML = reports.revenueByCarType && reports.revenueByCarType.length > 0 ? `
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
    ` : `
        <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Revenue by Car Type</h4>
            <div style="text-align: center; padding: 2rem; color: #64748b; background: #f8fafc; border-radius: 6px;">
                <i class="fas fa-chart-pie" style="font-size: 2rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                <p>No revenue data available</p>
            </div>
        </div>
    `;
    
    // Popular Cars
    const popularCarsHTML = reports.popularCars && reports.popularCars.length > 0 ? `
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
    ` : `
        <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Popular Cars</h4>
            <div style="text-align: center; padding: 2rem; color: #64748b; background: #f8fafc; border-radius: 6px;">
                <i class="fas fa-car" style="font-size: 2rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                <p>No car booking data available</p>
            </div>
        </div>
    `;
    
    // Top Customers
    const topCustomersHTML = reports.topCustomers && reports.topCustomers.length > 0 ? `
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
    ` : `
        <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; grid-column: 1 / -1;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b;">Top Customers</h4>
            <div style="text-align: center; padding: 2rem; color: #64748b; background: #f8fafc; border-radius: 6px;">
                <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                <p>No customer data available</p>
            </div>
        </div>
    `;
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            ${revenueByTypeHTML}
            ${popularCarsHTML}
            ${bookingTrendsHTML}
            ${topCustomersHTML}
        </div>
    `;
}

// Update car availability
async function updateCarAvailability(carId, available) {
    if (!available) return;
    
    if (!confirm(`Are you sure you want to mark this car as ${available === 'true' ? 'available' : 'not available'}?`)) {
        return;
    }
    
    try {
        console.log(`🔄 Updating car ${carId} availability to ${available}`);
        
        const response = await fetch(`${API_BASE}/admin/cars/${carId}/availability`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ available: available === 'true' })
        });
        
        console.log('📡 Update Car Availability API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📡 Update Car Availability API Response:', result);
        
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
        
        const response = await fetch(`${API_BASE}/admin/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Booking Details API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📋 Booking Details API Response:', result);
        
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
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Address:</span>
                        <span style="text-align: right;">
                            ${booking.user?.address ? 
                                `${booking.user.address.street || ''}, ${booking.user.address.city || ''}, ${booking.user.address.state || ''}` : 
                                'N/A'}
                        </span>
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
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Seats:</span>
                        <span>${booking.car?.seats || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Registration:</span>
                        <span>${booking.car?.registrationNumber || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Daily Rate:</span>
                        <span>₹${booking.car?.pricePerDay || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Hourly Rate:</span>
                        <span>₹${booking.car?.pricePerHour || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-calendar-alt" style="color: #f59e0b;"></i> Booking Details
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Booking ID:</span>
                        <span style="font-family: monospace;">${booking._id}</span>
                    </div>
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
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
                <h4 style="margin: 0 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-map-marker-alt" style="color: #ef4444;"></i> Location Details
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Pickup Location:</span>
                        <span style="text-align: right;">${booking.pickupLocation?.address || 'N/A'}, ${booking.pickupLocation?.city || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Dropoff Location:</span>
                        <span style="text-align: right;">${booking.dropoffLocation?.address || 'N/A'}, ${booking.dropoffLocation?.city || 'N/A'}</span>
                    </div>
                </div>
                
                <h4 style="margin: 1.5rem 0 1rem 0; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-history" style="color: #8b5cf6;"></i> Timeline
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Booking Created:</span>
                        <span>${new Date(booking.createdAt).toLocaleString()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 600; color: #475569;">Last Updated:</span>
                        <span>${new Date(booking.updatedAt).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update booking status
async function updateBookingStatus(bookingId, status) {
    if (!status) return;
    
    if (!confirm(`Are you sure you want to change booking status to "${status}"?`)) {
        return;
    }
    
    try {
        console.log(`🔄 Updating booking ${bookingId} status to ${status}`);
        
        const response = await fetch(`${API_BASE}/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        
        console.log('📡 Update Status API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📡 Update Status API Response:', result);
        
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
    if (confirm('Are you sure you want to logout from admin dashboard?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Show notification
function showNotification(message, type) {
    // Create notification element
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
        max-width: 400px;
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
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

console.log('✅ Admin Dashboard JavaScript loaded successfully!'); 

// Update the updateBookingStatus function in admin.js
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
        
        const response = await fetch(`${API_BASE}/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                status,
                adminNotes: adminNotes || undefined
            })
        });
        
        console.log('📡 Update Status API Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📡 Update Status API Response:', result);
        
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

// Add to admin.js - Show temporary notification for admin
function showTemporaryNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `temporary-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 20px;
        background: white;
        color: black;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInLeft 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        font-weight: 500;
        border-left: 4px solid;
        max-width: 400px;
        word-wrap: break-word;
    `;
    
    const borderColor = type === 'success' ? '#10b981' : 
                       type === 'error' ? '#ef4444' : 
                       type === 'warning' ? '#f59e0b' : '#3b82f6';
    
    notification.style.borderLeftColor = borderColor;
    
    const icon = type === 'success' ? '✅' : 
                type === 'error' ? '❌' : 
                type === 'warning' ? '⚠️' : 'ℹ️';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.1em;">${icon}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Update admin logout function
function logout() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Show logout notification
    showTemporaryNotification(`👋 Goodbye, ${user.name || 'Admin'}!`, 'info');
    
    if (confirm('Are you sure you want to logout from admin dashboard?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Enhanced API call with error handling
async function makeApiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
      throw new Error('Session expired. Please login again.');
    }

    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

