// API Configuration
const API_BASE = 'http://localhost:5000/api';

// Global variables
let currentUser = null;
let bookings = [];
let cars = [];
let selectedCar = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    console.log('🚗 Initializing Naidu Car Rentals...');
    setupEventListeners();
    loadCars();
    checkAuthStatus();
    setupDateInputs();
    updateUI();
    initializeSessionManagement();
}

// Setup all event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', showLogin);
    document.getElementById('registerBtn').addEventListener('click', showRegister);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin(e);
    });
    
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleRegister(e);
    });
    
    document.getElementById('bookingForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleBooking(e);
    });
    
    // Form interactions
    document.getElementById('rentalType').addEventListener('change', toggleRentalType);
    document.getElementById('duration').addEventListener('input', calculateTotal);
    document.getElementById('startDate').addEventListener('change', updateEndDate);
    document.getElementById('endDate').addEventListener('change', calculateTotal);
    
    // Filter interactions
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const brand = this.getAttribute('data-brand');
            filterCars(brand);
        });
    });
    
    document.getElementById('typeFilter').addEventListener('change', applyAllFilters);
    document.getElementById('priceFilter').addEventListener('change', applyAllFilters);
    document.getElementById('searchInput').addEventListener('input', searchCars);
    
    // Mobile menu
    document.querySelector('.mobile-menu-btn').addEventListener('click', toggleMobileMenu);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
                // Close mobile menu if open
                const navLinks = document.querySelector('.nav-links');
                if (navLinks) navLinks.classList.remove('active');
            }
        });
    });
}

// Show login modal
function showLogin() {
    console.log('🔓 Opening login modal...');
    closeAllModals();
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'block';
        document.getElementById('loginForm').reset();
    }
}

// Show register modal
function showRegister() {
    console.log('📝 Opening register modal...');
    closeAllModals();
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        registerModal.style.display = 'block';
        document.getElementById('registerForm').reset();
    }
}

// Close modal properly
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Setup date inputs
function setupDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (startDate) {
        startDate.min = today;
        startDate.value = today;
    }
    
    if (endDate) {
        endDate.min = tomorrow;
        endDate.value = tomorrow;
    }
}

// Load cars from API
async function loadCars() {
    try {
        console.log('🚗 Loading cars from API...');
        showLoading('carsContainer', 'Loading available cars...');
        
        const response = await fetch(`${API_BASE}/cars`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Cars API response:', result);
        
        if (result.success) {
            cars = result.cars || [];
            console.log(`🎯 Loaded ${cars.length} cars from database`);
            
            if (cars.length === 0) {
                loadSampleCars();
            } else {
                displayCars(cars);
            }
        } else {
            throw new Error(result.message || 'Failed to load cars');
        }
    } catch (error) {
        console.error('❌ Error loading cars from API:', error);
        loadSampleCars();
    }
}

// Load sample cars if API fails
function loadSampleCars() {
    console.log('🔄 Loading sample cars...');
    
    cars = [
        {
            _id: '1',
            make: 'Mahindra',
            model: 'Thar',
            year: 2024,
            type: 'SUV',
            pricePerDay: 2500,
            pricePerHour: 300,
            fuelType: 'Diesel',
            transmission: 'Manual',
            seats: 4,
            features: ['4x4', 'AC', 'Music System', 'Sunroof'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Mahindra Thar' 
            }],
            available: true,
            color: 'Black',
            mileage: '15 kmpl'
        },
        {
            _id: '2',
            make: 'Toyota',
            model: 'Fortuner',
            year: 2024,
            type: 'SUV',
            pricePerDay: 3500,
            pricePerHour: 400,
            fuelType: 'Diesel',
            transmission: 'Automatic',
            seats: 7,
            features: ['AC', 'Leather Seats', 'Sunroof', 'GPS'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Toyota Fortuner' 
            }],
            available: true,
            color: 'White',
            mileage: '12 kmpl'
        },
        {
            _id: '3',
            make: 'Maruti Suzuki',
            model: 'Swift',
            year: 2024,
            type: 'Hatchback',
            pricePerDay: 1200,
            pricePerHour: 150,
            fuelType: 'Petrol',
            transmission: 'Manual',
            seats: 5,
            features: ['AC', 'Power Steering', 'Music System'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Maruti Swift' 
            }],
            available: true,
            color: 'Red',
            mileage: '22 kmpl'
        },
        {
            _id: '4',
            make: 'Hyundai',
            model: 'Creta',
            year: 2024,
            type: 'SUV',
            pricePerDay: 2800,
            pricePerHour: 320,
            fuelType: 'Petrol',
            transmission: 'Automatic',
            seats: 5,
            features: ['AC', 'Sunroof', 'Touchscreen', 'Rear Camera'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Hyundai Creta' 
            }],
            available: true,
            color: 'Silver',
            mileage: '16 kmpl'
        },
        {
            _id: '5',
            make: 'Mahindra',
            model: 'Scorpio',
            year: 2024,
            type: 'SUV',
            pricePerDay: 2200,
            pricePerHour: 280,
            fuelType: 'Diesel',
            transmission: 'Manual',
            seats: 7,
            features: ['AC', 'Power Steering', 'Music System'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Mahindra Scorpio' 
            }],
            available: true,
            color: 'Grey',
            mileage: '14 kmpl'
        },
        {
            _id: '6',
            make: 'Toyota',
            model: 'Innova Crysta',
            year: 2024,
            type: 'MPV',
            pricePerDay: 3000,
            pricePerHour: 350,
            fuelType: 'Diesel',
            transmission: 'Automatic',
            seats: 8,
            features: ['AC', 'Leather Seats', 'Touchscreen', 'Rear AC'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Toyota Innova' 
            }],
            available: true,
            color: 'Blue',
            mileage: '13 kmpl'
        }
    ];
    
    console.log(`✅ Loaded ${cars.length} sample cars`);
    displayCars(cars);
}

// Display cars in grid
function displayCars(carsToDisplay) {
    const container = document.getElementById('carsContainer');
    
    if (!container) {
        console.error('❌ carsContainer element not found!');
        return;
    }
    
    if (!carsToDisplay || carsToDisplay.length === 0) {
        container.innerHTML = `
            <div class="no-cars">
                <i class="fas fa-car"></i>
                <h3>No cars available at the moment</h3>
                <p>Please check back later or contact support</p>
                <button class="btn btn-primary" onclick="loadCars()">Reload Cars</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = carsToDisplay.map(car => `
        <div class="car-card" data-brand="${car.make.toLowerCase()}" data-type="${car.type}">
            <div class="car-image-container">
                <img src="${getCarImage(car)}" 
                     alt="${car.make} ${car.model}" 
                     class="car-image"
                     onerror="this.src='https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
                ${!car.available ? '<div class="car-unavailable">Not Available</div>' : ''}
            </div>
            <div class="car-info">
                <h3 class="car-name">${car.make} ${car.model} (${car.year})</h3>
                <div class="car-details">
                    <span><i class="fas fa-car"></i> ${car.type}</span>
                    <span><i class="fas fa-users"></i> ${car.seats} Seats</span>
                    <span><i class="fas fa-cog"></i> ${car.transmission}</span>
                </div>
                <div class="car-features">
                    <small><i class="fas fa-gas-pump"></i> ${car.fuelType} • ${car.mileage || '15 kmpl'}</small>
                </div>
                <div class="car-features">
                    <small>${car.features ? car.features.slice(0, 3).join(' • ') : 'Premium features included'}</small>
                </div>
                <div class="car-price">
                    <span class="price-main">₹${car.pricePerHour}/hour</span>
                    <span class="price-alt">or ₹${car.pricePerDay}/day</span>
                </div>
                <button class="book-btn" onclick="showBookingForm('${car._id}')" 
                    ${!car.available ? 'disabled' : ''}>
                    ${car.available ? '<i class="fas fa-calendar-plus"></i> Book Now' : 'Not Available'}
                </button>
            </div>
        </div>
    `).join('');
    
    console.log(`✅ Displayed ${carsToDisplay.length} cars`);
}

// Helper function to get car image
function getCarImage(car) {
    if (car.images && car.images[0] && car.images[0].url) {
        return car.images[0].url;
    }
    
    // Default images based on car make
    const defaultImages = {
        'mahindra': 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'toyota': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'maruti': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'hyundai': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    };
    
    return defaultImages[car.make.toLowerCase()] || 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
}

// Filter cars by brand
function filterCars(brand) {
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-brand') === brand) {
            btn.classList.add('active');
        }
    });
    
    const filteredCars = brand === 'all' ? cars : cars.filter(car => 
        car.make.toLowerCase().includes(brand.toLowerCase())
    );
    displayCars(filteredCars);
}

// Apply all filters
function applyAllFilters() {
    const typeFilter = document.getElementById('typeFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const activeBrand = document.querySelector('.company-btn.active')?.getAttribute('data-brand') || 'all';
    
    let filteredCars = cars;
    
    if (activeBrand !== 'all') {
        filteredCars = filteredCars.filter(car => 
            car.make.toLowerCase().includes(activeBrand.toLowerCase())
        );
    }
    
    if (typeFilter) {
        filteredCars = filteredCars.filter(car => car.type === typeFilter);
    }
    
    if (priceFilter) {
        const [min, max] = priceFilter.split('-').map(Number);
        filteredCars = filteredCars.filter(car => {
            if (max) {
                return car.pricePerHour >= min && car.pricePerHour <= max;
            } else {
                return car.pricePerHour >= min;
            }
        });
    }
    
    if (searchQuery) {
        filteredCars = filteredCars.filter(car => 
            car.make.toLowerCase().includes(searchQuery) ||
            car.model.toLowerCase().includes(searchQuery) ||
            car.type.toLowerCase().includes(searchQuery)
        );
    }
    
    displayCars(filteredCars);
}

// Search cars
function searchCars() {
    applyAllFilters();
}

// Show booking form
async function showBookingForm(carId) {
    if (!currentUser) {
        showNotification('Please login to book a car', 'warning');
        showLogin();
        return;
    }

    selectedCar = cars.find(car => car._id === carId);
    if (!selectedCar) {
        showNotification('Car not found', 'error');
        return;
    }

    if (!selectedCar.available) {
        showNotification('This car is not available for booking', 'warning');
        return;
    }

    // Pre-fill user details
    document.getElementById('customerName').value = currentUser.name;
    document.getElementById('customerEmail').value = currentUser.email;
    document.getElementById('customerPhone').value = currentUser.phone || '';
    document.getElementById('customerAddress').value = currentUser.address || '';

    // Update car info
    document.getElementById('selectedCarInfo').innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${getCarImage(selectedCar)}" 
                 alt="${selectedCar.make} ${selectedCar.model}" 
                 style="width: 60px; height: 40px; object-fit: cover; border-radius: 5px;">
            <div>
                <strong>${selectedCar.make} ${selectedCar.model}</strong>
                <div style="font-size: 0.8rem; color: var(--slate);">
                    ${selectedCar.type} • ${selectedCar.seats} seats • ${selectedCar.fuelType}
                </div>
            </div>
        </div>
    `;

    calculateTotal();
    document.getElementById('bookingModal').style.display = 'block';
}

// Calculate total amount
function calculateTotal() {
    if (!selectedCar) return;
    
    const duration = parseInt(document.getElementById('duration').value) || 1;
    const rentalType = document.getElementById('rentalType').value;
    const pricePerUnit = rentalType === 'hours' ? selectedCar.pricePerHour : selectedCar.pricePerDay;
    const total = pricePerUnit * duration;
    
    document.getElementById('totalAmount').textContent = total.toLocaleString();
    document.getElementById('rateDisplay').textContent = `₹${pricePerUnit}/${rentalType === 'hours' ? 'hour' : 'day'}`;
    document.getElementById('durationDisplay').textContent = `${duration} ${rentalType}`;
}

// Toggle rental type
function toggleRentalType() {
    const rentalType = document.getElementById('rentalType').value;
    document.getElementById('durationLabel').textContent = 
        rentalType === 'hours' ? 'Duration (Hours)' : 'Duration (Days)';
    document.getElementById('duration').value = 1;
    calculateTotal();
}

// Update end date based on start date and duration
function updateEndDate() {
    const startDate = new Date(document.getElementById('startDate').value);
    const duration = parseInt(document.getElementById('duration').value) || 1;
    const rentalType = document.getElementById('rentalType').value;
    
    const endDate = new Date(startDate);
    if (rentalType === 'hours') {
        endDate.setHours(endDate.getHours() + duration);
    } else {
        endDate.setDate(endDate.getDate() + duration);
    }
    
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    calculateTotal();
}

// Handle registration
async function handleRegister(e) {
    console.log('📝 Registration form submitted');
    
    const userData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value
    };

    console.log('👤 Registration data:', userData);

    // Validate required fields
    if (!userData.name || !userData.email || !userData.password || !userData.phone) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    try {
        showLoading('registerModal', 'Creating your account...');
        
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        console.log('📊 Registration response:', result);

        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            currentUser = result.user;
            
            // Initialize session management after registration
            initializeSessionManagement();
            
            closeModal('registerModal');
            updateUI();
            await loadUserBookings();
            
            showNotification('🎉 Registration successful! Welcome, ' + currentUser.name, 'success');
            
        } else {
            throw new Error(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
        
        // Remove loading state
        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            registerModal.querySelector('.loading')?.remove();
        }
    }
}

// Handle login - CORRECTED VERSION
async function handleLogin(e) {
    console.log('🔐 Login form submitted');
    
    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    console.log('👤 Login attempt:', credentials.email);

    if (!credentials.email || !credentials.password) {
        showNotification('Please enter email and password', 'error');
        return;
    }

    try {
        showLoading('loginModal', 'Authenticating...');
        
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const result = await response.json();
        console.log('📊 Login response:', result);

        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            currentUser = result.user;
            
            // Initialize session management after login
            initializeSessionManagement();
            
            closeModal('loginModal');
            updateUI();
            await loadUserBookings();
            
            if (currentUser.role === 'admin') {
                showNotification(`🎉 Welcome Admin ${currentUser.name}! Access your dashboard from the navigation.`, 'success');
            } else {
                showNotification(`✅ Welcome back, ${currentUser.name}!`, 'success');
            }
        } else {
            throw new Error(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification(error.message || 'Login failed. Please check credentials.', 'error');
        
        // Remove loading state
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.querySelector('.loading')?.remove();
        }
    }
}

// Handle booking
async function handleBooking(e) {
    console.log('📅 Booking form submitted');
    
    if (!selectedCar || !currentUser) {
        showNotification('Please select a car and ensure you are logged in', 'error');
        return;
    }

    const bookingData = {
        carId: selectedCar._id,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        rentalType: document.getElementById('rentalType').value,
        duration: parseInt(document.getElementById('duration').value) || 1,
        pickupLocation: {
            address: "Naidu Car Rentals Main Branch",
            city: "Hyderabad"
        },
        dropoffLocation: {
            address: "Naidu Car Rentals Main Branch", 
            city: "Hyderabad"
        }
    };

    console.log('🚗 Booking data:', bookingData);

    try {
        showLoading('bookingModal', 'Processing your booking...');
        
        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        console.log('📊 Booking response:', result);

        if (result.success) {
            showNotification('🎉 Booking confirmed for ' + selectedCar.make + ' ' + selectedCar.model, 'success');
            closeModal('bookingModal');
            await loadUserBookings();
        } else {
            throw new Error(result.message || 'Booking failed');
        }
    } catch (error) {
        console.error('❌ Booking error:', error);
        showNotification(error.message || 'Failed to book car. Please try again.', 'error');
    }
}

// Load user bookings
async function loadUserBookings() {
    if (!currentUser) {
        displayBookings();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/bookings/my-bookings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            bookings = result.bookings || [];
            console.log('✅ Loaded bookings:', bookings.length);
            displayBookings();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = [];
        displayBookings();
    }
}

// Display bookings
function displayBookings() {
    const container = document.getElementById('bookingsContainer');
    
    if (!currentUser) {
        container.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-key"></i>
                <h3>Please login to view your bookings</h3>
                <button class="btn btn-primary" onclick="showLogin()">Login Now</button>
            </div>
        `;
        return;
    }

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-calendar-plus"></i>
                <h3>No bookings yet</h3>
                <p>Book your first car to see your reservations here!</p>
                <button class="btn btn-primary" onclick="scrollToCars()">Browse Cars</button>
            </div>
        `;
        return;
    }

    container.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header">
                <h3>${booking.car?.make || 'Car'} ${booking.car?.model || ''}</h3>
                <span class="booking-status ${booking.status}">${booking.status}</span>
            </div>
            <div class="booking-details">
                <p><i class="fas fa-calendar"></i> <strong>Dates:</strong> 
                   ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</p>
                <p><i class="fas fa-clock"></i> <strong>Duration:</strong> 
                   ${booking.duration} ${booking.rentalType}</p>
                <p><i class="fas fa-rupee-sign"></i> <strong>Total:</strong> ₹${booking.totalPrice}</p>
                <p><i class="fas fa-map-marker-alt"></i> <strong>Pickup:</strong> ${booking.pickupLocation?.address || 'Main Branch'}</p>
            </div>
            <div class="booking-footer">
                <small>Booked on: ${new Date(booking.createdAt).toLocaleDateString()}</small>
                <div class="booking-actions">
                    ${booking.status === 'pending' ? 
                        `<button class="btn btn-warning btn-small" onclick="cancelBooking('${booking._id}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>` : ''}
                    
                    ${booking.status === 'confirmed' ? 
                        `<button class="btn btn-warning btn-small" onclick="cancelBooking('${booking._id}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>` : ''}
                    
                    ${booking.status === 'active' ? 
                        `<button class="btn btn-success btn-small" onclick="markBookingAsCompleted('${booking._id}')">
                            <i class="fas fa-check"></i> Mark Complete
                        </button>` : ''}
                    
                    ${booking.status === 'completed' ? 
                        `<span class="status-completed"><i class="fas fa-check-circle"></i> Completed</span>` : ''}
                    
                    ${booking.status === 'cancelled' ? 
                        `<span class="status-cancelled"><i class="fas fa-times-circle"></i> Cancelled</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Update UI based on auth status - IMPROVED VERSION
function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authButtons = document.querySelector('.auth-buttons');
    const navLinks = document.querySelector('.nav-links');
    
    console.log('🔄 Updating UI, currentUser:', currentUser);
    
    // Remove existing user display
    const existingUserDisplay = document.querySelector('.user-display');
    if (existingUserDisplay) {
        existingUserDisplay.remove();
    }

    // Remove existing admin link if any
    const existingAdminLink = document.querySelector('.admin-nav-link');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }

    if (currentUser) {
        // User is logged in
        console.log('👤 User logged in:', currentUser.name);
        
        // Create user display element
        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-display';
        userDisplay.innerHTML = `
            <span style="color: var(--green); font-weight: 600; margin-right: 1rem;">
                <i class="fas fa-user"></i> Welcome, ${currentUser.name}
            </span>
            <button class="btn btn-secondary btn-small" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        
        // Replace auth buttons with user display
        authButtons.innerHTML = '';
        authButtons.appendChild(userDisplay);
        
        // Add Admin Dashboard link to navigation if user is admin
        if (currentUser.role === 'admin') {
            console.log('👑 Admin user detected, adding dashboard link to nav');
            
            // Create admin dashboard link
            const adminLink = document.createElement('a');
            adminLink.href = "admin.html";
            adminLink.className = "admin-nav-link";
            adminLink.innerHTML = `
                <i class="fas fa-user-shield"></i> Admin Dashboard
            `;
            adminLink.style.cssText = `
                background: linear-gradient(45deg, #f59e0b, #fbbf24);
                color: white !important;
                padding: 0.5rem 1rem !important;
                border-radius: 5px;
                font-weight: 600;
                transition: all 0.3s ease;
            `;
            
            // Add hover effects
            adminLink.addEventListener('mouseenter', function() {
                this.style.background = 'linear-gradient(45deg, #d97706, #f59e0b)';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 5px 15px rgba(245, 158, 11, 0.4)';
            });
            
            adminLink.addEventListener('mouseleave', function() {
                this.style.background = 'linear-gradient(45deg, #f59e0b, #fbbf24)';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
            // Find the "My Bookings" link and replace it with Admin Dashboard
            const bookingsLink = Array.from(navLinks.children).find(child => 
                child.textContent.includes('My Bookings')
            );
            
            if (bookingsLink) {
                bookingsLink.replaceWith(adminLink);
                console.log('✅ Replaced "My Bookings" with "Admin Dashboard" for admin');
            } else {
                // If "My Bookings" not found, insert before auth buttons
                navLinks.insertBefore(adminLink, authButtons);
                console.log('✅ Added "Admin Dashboard" to navigation');
            }
        }
        
    } else {
        // User is not logged in
        console.log('👤 No user logged in');
        authButtons.innerHTML = `
            <button class="btn btn-primary" id="loginBtn">Login</button>
            <button class="btn btn-secondary" id="registerBtn">Register</button>
        `;
        
        // Ensure "My Bookings" link exists for non-admin users
        const existingBookingsLink = document.querySelector('a[href="#bookings"]');
        if (!existingBookingsLink) {
            const bookingsLink = document.createElement('a');
            bookingsLink.href = "#bookings";
            bookingsLink.textContent = "My Bookings";
            bookingsLink.style.cssText = `
                color: var(--lightest-slate);
                text-decoration: none;
                font-weight: 500;
                transition: all 0.3s ease;
                padding: 0.5rem 0;
                position: relative;
            `;
            
            // Add hover effect
            bookingsLink.addEventListener('mouseenter', function() {
                this.style.color = 'var(--green)';
            });
            
            bookingsLink.addEventListener('mouseleave', function() {
                this.style.color = 'var(--lightest-slate)';
            });
            
            // Insert before auth buttons
            navLinks.insertBefore(bookingsLink, authButtons);
        }
        
        // Re-attach event listeners to new buttons
        setTimeout(() => {
            const newLoginBtn = document.getElementById('loginBtn');
            const newRegisterBtn = document.getElementById('registerBtn');
            
            if (newLoginBtn) {
                newLoginBtn.addEventListener('click', showLogin);
            }
            if (newRegisterBtn) {
                newRegisterBtn.addEventListener('click', showRegister);
            }
        }, 100);
    }
}

// Check auth status on page load - UPDATED VERSION
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Check if session is still valid
    const activeSession = sessionStorage.getItem('naiduCarRentalsActiveSession');
    
    if (token && userData && activeSession) {
        try {
            currentUser = JSON.parse(userData);
            console.log('🔑 User session found:', currentUser.name);
            
            // Initialize session management
            initializeSessionManagement();
            
            updateUI();
            loadUserBookings();
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    } else if (token && userData && !activeSession) {
        // Session expired - auto logout
        console.log('⏰ Session expired - auto logging out');
        logout();
    } else {
        console.log('🔑 No active user session found');
        updateUI();
    }
}

// Logout function
function logout() {
    console.log('👋 Logging out user:', currentUser?.name);
    
    // Clear all storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('naiduCarRentalsActiveSession');
    
    // Reset state
    currentUser = null;
    bookings = [];
    
    updateUI();
    displayBookings();
    showNotification('👋 Logged out successfully', 'info');
}

// Show loading state
function showLoading(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        const existingLoading = container.querySelector('.loading');
        if (existingLoading) existingLoading.remove();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        `;
        container.appendChild(loadingDiv);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--green)' : 
                     type === 'error' ? 'var(--red)' : 
                     type === 'warning' ? 'var(--yellow)' : 'var(--light-slate)'};
        color: ${type === 'warning' ? 'var(--navy-blue)' : 'white'};
        padding: 1rem 1.5rem;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
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
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Show error state
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Cars</h3>
                <p>${message}</p>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="loadCars()">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                    <button class="btn btn-secondary" onclick="loadSampleCars()">
                        <i class="fas fa-car"></i> Use Sample Cars
                    </button>
                </div>
            </div>
        `;
    }
}

// Scroll to cars section
function scrollToCars() {
    document.getElementById('cars').scrollIntoView({ behavior: 'smooth' });
}

// Enhanced Mobile Menu Function
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const body = document.body;
    
    navLinks.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (navLinks.classList.contains('active')) {
        body.style.overflow = 'hidden';
        mobileBtn.innerHTML = '<i class="fas fa-times"></i>';
    } else {
        body.style.overflow = '';
        mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
    
    // Ensure admin link is visible in mobile menu
    const adminLink = document.querySelector('.admin-nav-link');
    if (adminLink && navLinks.classList.contains('active')) {
        adminLink.style.display = 'flex';
    }
}

// Session management for automatic logout on tab close
function initializeSessionManagement() {
    console.log('🔐 Initializing session management...');
    
    // Set session flag when user logs in
    if (currentUser) {
        sessionStorage.setItem('naiduCarRentalsActiveSession', 'true');
        console.log('✅ Session tracking enabled');
    }
    
    // Check session on page load
    window.addEventListener('load', function() {
        const activeSession = sessionStorage.getItem('naiduCarRentalsActiveSession');
        if (!activeSession && (localStorage.getItem('token') || localStorage.getItem('user'))) {
            console.log('🚫 Session expired - auto logging out');
            logout();
        }
    });
    
    // Detect tab/browser close
    window.addEventListener('beforeunload', function(e) {
        if (currentUser) {
            console.log('👋 Tab closing - preparing for auto logout');
            // Don't clear localStorage here, let the unload event handle it
        }
    });
    
    // Handle page unload (tab close, refresh, navigation)
    window.addEventListener('unload', function() {
        if (currentUser) {
            console.log('🚪 User leaving - auto logout triggered');
            // We can't make API calls here, but we can clear local storage
            // The actual logout will happen on next page load via sessionStorage check
        }
    });
}

// User marks booking as completed
async function markBookingAsCompleted(bookingId) {
    if (!confirm('Are you sure you want to mark this booking as completed?')) {
        return;
    }

    try {
        showLoading('bookingsContainer', 'Marking booking as completed...');
        
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/complete`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Booking marked as completed successfully!', 'success');
            await loadUserBookings();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error completing booking:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// User cancels booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        showLoading('bookingsContainer', 'Cancelling booking...');
        
        const response = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification('✅ Booking cancelled successfully!', 'success');
            await loadUserBookings();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

console.log('✅ Naidu Car Rentals Frontend loaded successfully!');