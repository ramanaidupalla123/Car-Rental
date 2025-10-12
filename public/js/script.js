// Dynamic API Base URL for mobile compatibility
const API_BASE = (function() {
    // If we're in production (on Render), use the production URL
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const productionUrl = `${window.location.origin}/api`;
        console.log('🌐 Production API URL:', productionUrl);
        return productionUrl;
    }
    // For local development
    const localUrl = 'http://localhost:10000/api';
    console.log('🌐 Local API URL:', localUrl);
    return localUrl;
})();

// Global variables
let currentUser = null;
let bookings = [];
let cars = [];
let selectedCar = null;

// Enhanced fetch with mobile error handling
async function mobileFetch(url, options = {}) {
    try {
        console.log('📡 API Call:', url);
        
        // Add timeout for mobile networks (15 seconds for slower connections)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const fetchOptions = {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        };
        
        // Add authorization header if token exists
        const token = localStorage.getItem('token');
        if (token && !fetchOptions.headers.Authorization) {
            fetchOptions.headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(url, fetchOptions);
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    } catch (error) {
        console.error('📱 Mobile fetch error:', error);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please check your internet connection.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network connection failed. Please check your internet and try again.');
        }
        
        throw error;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Main initialization function
function initializeApp() {
    console.log('🚗 Initializing Naidu Car Rentals...');
    console.log('📱 Mobile Compatibility: Enabled');
    console.log('🌐 Current Host:', window.location.hostname);
    console.log('🔗 API Base:', API_BASE);
    
    setupEventListeners();
    loadCars();
    checkAuthStatus();
    setupDateInputs();
    updateUI();
    initializeSessionManagement();
    initializeMobileNavigation();
    addNotificationStyles();
    initializeMobileFeatures();
}

// Add mobile-specific features
function initializeMobileFeatures() {
    // Prevent zoom on input focus for better mobile experience
    document.addEventListener('touchstart', function() {}, {passive: true});
    
    // Add touch-friendly styles
    document.documentElement.style.setProperty('--min-touch-size', '44px');
    
    // Mobile viewport fix
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }
    
    console.log('✅ Mobile features initialized');
}

// Setup all event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Auth buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', showLogin);
    if (registerBtn) registerBtn.addEventListener('click', showRegister);
    
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
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const bookingForm = document.getElementById('bookingForm');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (bookingForm) bookingForm.addEventListener('submit', handleBooking);
    if (profileForm) profileForm.addEventListener('submit', handleProfileUpdate);
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);
    
    // Settings tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchSettingsTab(tab);
        });
    });
    
    // Form interactions
    const rentalType = document.getElementById('rentalType');
    const duration = document.getElementById('duration');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    if (rentalType) rentalType.addEventListener('change', toggleRentalType);
    if (duration) duration.addEventListener('input', calculateTotal);
    if (startDate) startDate.addEventListener('change', updateEndDate);
    if (endDate) endDate.addEventListener('change', calculateTotal);
    
    // Filter interactions
    document.querySelectorAll('.company-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const brand = this.getAttribute('data-brand');
            filterCars(brand);
        });
    });
    
    const typeFilter = document.getElementById('typeFilter');
    const priceFilter = document.getElementById('priceFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (typeFilter) typeFilter.addEventListener('change', applyAllFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyAllFilters);
    if (searchInput) searchInput.addEventListener('input', searchCars);
    
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
            }
        });
    });
}

// Settings Tab Switching
function switchSettingsTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        if (tab.id === tabName + 'Tab') {
            tab.classList.add('active');
        }
    });
}

// Show settings modal
function showSettings() {
    if (!currentUser) {
        showNotification('Please login to access settings', 'warning');
        return;
    }
    
    console.log('⚙️ Opening settings modal...');
    closeAllModals();
    
    // Populate profile form with current user data
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone || '';
    document.getElementById('profileAddress').value = currentUser.address || '';
    
    // Reset password form
    document.getElementById('passwordForm').reset();
    
    // Switch to profile tab by default
    switchSettingsTab('profile');
    
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.style.display = 'block';
    }
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const profileData = {
        name: document.getElementById('profileName').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value
    };

    if (!profileData.name || !profileData.phone) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    try {
        showLoading('settingsModal', 'Updating profile...');
        
        const response = await mobileFetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (result.success) {
            // Update local user data
            currentUser.name = profileData.name;
            currentUser.phone = profileData.phone;
            currentUser.address = profileData.address;
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            // Update UI
            updateUI();
            
            showNotification('✅ Profile updated successfully!', 'success');
            document.getElementById('settingsModal').style.display = 'none';
        } else {
            throw new Error(result.message || 'Profile update failed');
        }
    } catch (error) {
        console.error('❌ Profile update error:', error);
        showNotification('Error updating profile: ' + error.message, 'error');
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const passwordData = {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showNotification('Please fill all password fields', 'error');
        return;
    }

    if (passwordData.newPassword.length < 6) {
        showNotification('New password must be at least 6 characters long', 'error');
        return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    try {
        showLoading('settingsModal', 'Changing password...');
        
        const response = await mobileFetch(`${API_BASE}/users/change-password`, {
            method: 'PUT',
            body: JSON.stringify({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('✅ Password changed successfully!', 'success');
            document.getElementById('passwordForm').reset();
            document.getElementById('settingsModal').style.display = 'none';
        } else {
            throw new Error(result.message || 'Password change failed');
        }
    } catch (error) {
        console.error('❌ Password change error:', error);
        showNotification('Error changing password: ' + error.message, 'error');
    }
}

// Mobile Navigation Functions
function initializeMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavLinks = document.getElementById('mobileNavLinks');

    // Open mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', openMobileMenu);
    }

    // Close mobile menu
    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking overlay
    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
}

function openMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavLinks = document.getElementById('mobileNavLinks');

    if (mobileMenuBtn && mobileNavOverlay && mobileNavLinks) {
        mobileMenuBtn.classList.add('active');
        mobileNavOverlay.style.display = 'block';
        mobileNavLinks.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('📱 Mobile menu opened');
    }
}

function closeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavLinks = document.getElementById('mobileNavLinks');

    if (mobileMenuBtn && mobileNavOverlay && mobileNavLinks) {
        mobileMenuBtn.classList.remove('active');
        mobileNavOverlay.style.display = 'none';
        mobileNavLinks.classList.remove('active');
        document.body.style.overflow = '';
        console.log('📱 Mobile menu closed');
    }
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

// Load cars from API - FIXED VERSION
async function loadCars() {
    try {
        console.log('🚗 Loading cars from API...');
        showLoading('carsContainer', 'Loading available cars...');
        
        const response = await mobileFetch(`${API_BASE}/cars`);
        
        const result = await response.json();
        console.log('✅ Cars API response received');
        
        if (result.success && result.cars) {
            cars = result.cars;
            console.log(`🎯 Loaded ${cars.length} cars from database`);
            
            // Debug: Log all car IDs and names
            cars.forEach((car, index) => {
                console.log(`   ${index + 1}. ${car.make} ${car.model} (ID: ${car._id})`);
            });
            
            displayCars(cars);
        } else {
            throw new Error(result.message || 'No cars data received');
        }
    } catch (error) {
        console.error('❌ Error loading cars from API:', error);
        showNotification('Using sample cars. API connection failed: ' + error.message, 'warning');
        loadSampleCars();
    }
}

// Load sample cars if API fails - FIXED VERSION
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
        },
        {
            _id: '7',
            make: 'Hyundai',
            model: 'Venue',
            year: 2024,
            type: 'SUV',
            pricePerDay: 2000,
            pricePerHour: 250,
            fuelType: 'Petrol',
            transmission: 'Manual',
            seats: 5,
            features: ['AC', 'Touchscreen', 'Rear Camera', 'Sunroof'],
            images: [{ 
                url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80', 
                alt: 'Hyundai Venue' 
            }],
            available: true,
            color: 'White',
            mileage: '18 kmpl'
        }
    ];
    
    console.log(`✅ Loaded ${cars.length} sample cars`);
    displayCars(cars);
}

// Display cars in grid - FIXED VERSION
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
    
    console.log(`🔄 Displaying ${carsToDisplay.length} cars`);
    
    container.innerHTML = carsToDisplay.map(car => {
        const carImage = getCarImage(car);
        
        return `
        <div class="car-card" data-brand="${car.make.toLowerCase()}" data-type="${car.type}">
            <div class="car-image-container">
                <img src="${carImage}" 
                     alt="${car.make} ${car.model}" 
                     class="car-image"
                     loading="lazy"
                     onerror="handleImageError(this, '${car.make}', '${car.model}')">
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
    `}).join('');
    
    console.log(`✅ Displayed ${carsToDisplay.length} cars`);
}

// Guaranteed image function
function getCarImage(car) {
    // First, check if the car has a valid image URL in database
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
        const firstImage = car.images[0];
        if (firstImage && firstImage.url && firstImage.url.startsWith('http')) {
            return firstImage.url;
        }
    }
    
    // Fallback images based on car make
    const fallbackImages = {
        'Mahindra': 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'Toyota': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'Maruti Suzuki': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'Hyundai': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    };
    
    return fallbackImages[car.make] || 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
}

// Image error handler
function handleImageError(img, make, model) {
    console.error(`❌ Image failed to load for ${make} ${model}`);
    
    // Fallback images based on car type
    const fallbackByType = {
        'SUV': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'Sedan': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'Hatchback': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'MPV': 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    };
    
    const carType = document.querySelector(`[data-brand="${make.toLowerCase()}"][data-type]`)?.getAttribute('data-type') || 'SUV';
    const fallback = fallbackByType[carType] || 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    
    img.src = fallback;
    img.alt = `${make} ${model} - Car Image`;
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

// Show booking form - FIXED VERSION
async function showBookingForm(carId) {
    console.log('📅 Show booking form for car ID:', carId);
    
    if (!currentUser) {
        showNotification('Please login to book a car', 'warning');
        showLogin();
        return;
    }

    // Find car by ID - FIXED: Use proper ID comparison
    selectedCar = cars.find(car => car._id === carId || car._id.toString() === carId);
    
    if (!selectedCar) {
        console.error('❌ Car not found with ID:', carId);
        showNotification('Car not found', 'error');
        return;
    }

    if (!selectedCar.available) {
        showNotification('This car is not available for booking', 'warning');
        return;
    }

    console.log('✅ Selected car:', selectedCar.make, selectedCar.model);

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
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value
    };

    if (!userData.name || !userData.email || !userData.password || !userData.phone) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    try {
        showLoading('registerModal', 'Creating your account...');
        
        const response = await mobileFetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            currentUser = result.user;
            
            initializeSessionManagement();
            
            closeAllModals();
            updateUI();
            await loadUserBookings();
            
            showTemporaryNotification('🎉 Registration successful! Welcome, ' + currentUser.name, 'success');
        } else {
            throw new Error(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const credentials = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };

    if (!credentials.email || !credentials.password) {
        showNotification('Please enter email and password', 'error');
        return;
    }

    try {
        showLoading('loginModal', 'Authenticating...');
        
        const response = await mobileFetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            currentUser = result.user;
            
            initializeSessionManagement();
            
            closeAllModals();
            updateUI();
            await loadUserBookings();
            
            if (currentUser.role === 'admin') {
                showTemporaryNotification(`🎉 Welcome Admin ${currentUser.name}!`, 'success');
            } else {
                showTemporaryNotification(`✅ Welcome back, ${currentUser.name}!`, 'success');
            }
        } else {
            throw new Error(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification(error.message || 'Login failed. Please check credentials.', 'error');
    }
}

// Handle booking
async function handleBooking(e) {
    e.preventDefault();
    
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

    try {
        showLoading('bookingModal', 'Processing your booking...');
        
        const response = await mobileFetch(`${API_BASE}/bookings`, {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('🎉 Booking confirmed for ' + selectedCar.make + ' ' + selectedCar.model, 'success');
            closeAllModals();
            
            await loadUserBookings();
            
            setTimeout(() => {
                document.getElementById('bookings').scrollIntoView({ behavior: 'smooth' });
            }, 500);
            
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
        const response = await mobileFetch(`${API_BASE}/bookings/my-bookings`);
        const result = await response.json();
        
        if (result.success) {
            bookings = result.bookings || [];
            displayBookings();
        } else {
            throw new Error(result.message || 'Failed to load bookings');
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
    if (!container) return;
    
    if (!currentUser) {
        container.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-key"></i>
                <h3>Please login to view your bookings</h3>
                <p>Login to see your booking history and manage your rentals</p>
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

    container.innerHTML = bookings.map(booking => {
        return `
        <div class="booking-card" data-booking-id="${booking._id}">
            <div class="booking-header">
                <h3>${booking.car?.make || 'Car'} ${booking.car?.model || ''}</h3>
                <span class="booking-status ${booking.status}">${booking.status.toUpperCase()}</span>
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
                </div>
            </div>
        </div>
    `}).join('');
}

// Update UI based on auth status - FIXED ADMIN DASHBOARD
function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authButtons = document.querySelector('.auth-buttons');
    const navLinks = document.querySelector('.nav-links');
    const mobileAuthButtons = document.querySelector('.mobile-auth-buttons');
    
    console.log('🔄 Updating UI, currentUser:', currentUser);
    console.log('👑 User role:', currentUser?.role);
    
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

    // Remove existing mobile admin link if any
    const existingMobileAdminLink = document.querySelector('.mobile-admin-link');
    if (existingMobileAdminLink) {
        existingMobileAdminLink.remove();
    }

    // Remove existing settings button if any
    const existingSettingsBtn = document.querySelector('.settings-btn');
    if (existingSettingsBtn) {
        existingSettingsBtn.remove();
    }

    if (currentUser) {
        // User is logged in
        console.log('👤 User logged in:', currentUser.name, 'Role:', currentUser.role);
        
        // Create user display with settings button
        const userDisplay = document.createElement('div');
        userDisplay.className = 'user-display';
        userDisplay.innerHTML = `
            <span title="${currentUser.name}${currentUser.role === 'admin' ? ' (Admin)' : ''}">
                <i class="fas fa-user"></i> ${currentUser.name}
                ${currentUser.role === 'admin' ? ' 👑' : ''}
            </span>
            <button class="settings-btn" onclick="showSettings()" title="Account Settings">
                <i class="fas fa-cog"></i>
            </button>
            <button class="btn btn-secondary btn-small" onclick="logout()" style="flex-shrink: 0;">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
        
        // Replace desktop auth buttons with user display
        if (authButtons) {
            authButtons.innerHTML = '';
            authButtons.appendChild(userDisplay);
        }
        
        // Update Mobile Auth Section
        if (mobileAuthButtons) {
            mobileAuthButtons.innerHTML = `
                <div style="text-align: center; color: var(--green); margin-bottom: 1rem;">
                    <i class="fas fa-user"></i> Welcome, ${currentUser.name}
                    ${currentUser.role === 'admin' ? ' 👑' : ''}
                </div>
                <button class="btn btn-primary btn-full" onclick="showSettings(); closeMobileMenu();">
                    <i class="fas fa-cog"></i> Account Settings
                </button>
                <button class="btn btn-secondary btn-full" onclick="logout(); closeMobileMenu();">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
        }
        
        // Add Admin Dashboard link to navigation if user is admin
        if (currentUser.role === 'admin' && navLinks) {
            console.log('👑 Admin user detected, adding dashboard link to nav');
            
            // Create admin dashboard link for desktop
            const adminLink = document.createElement('a');
            adminLink.href = "admin.html";
            adminLink.className = "admin-nav-link";
            adminLink.innerHTML = `
                <i class="fas fa-user-shield"></i> Admin Dashboard
            `;
            adminLink.style.cssText = `
    background: linear-gradient(45deg, #f59e0b, #fbbf24);
    color: white !important;
    padding: 0.4rem 0.8rem !important;
    border-radius: 5px;
    font-weight: 600;
    transition: all 0.3s ease;
    margin-right: 0.5rem;
    text-decoration: none;
    display: inline-block;
    white-space: nowrap;
    font-size: 0.85rem;
    flex-shrink: 0;
    border: none;
    cursor: pointer;
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
            
            // Insert admin link before auth buttons
            if (authButtons && authButtons.parentNode) {
                navLinks.insertBefore(adminLink, authButtons);
                console.log('✅ Added "Admin Dashboard" to desktop navigation');
            }
            
            // Also add to mobile navigation
            const mobileNavLinks = document.getElementById('mobileNavLinks');
            if (mobileNavLinks) {
                const mobileAdminLink = document.createElement('a');
                mobileAdminLink.href = "admin.html";
                mobileAdminLink.className = "mobile-admin-link";
                mobileAdminLink.innerHTML = `
                    <i class="fas fa-user-shield"></i> Admin Dashboard
                `;
                mobileAdminLink.style.cssText = `
                    background: linear-gradient(45deg, #f59e0b, #fbbf24);
                    color: white !important;
                    padding: 1rem !important;
                    border-radius: 8px;
                    font-weight: 600;
                    text-align: center;
                    margin: 0.5rem 1rem;
                    text-decoration: none;
                    display: block;
                    transition: all 0.3s ease;
                `;
                
                mobileAdminLink.addEventListener('click', closeMobileMenu);
                
                // Insert at the top of mobile nav
                mobileNavLinks.insertBefore(mobileAdminLink, mobileNavLinks.firstChild);
                console.log('✅ Added "Admin Dashboard" to mobile navigation');
            }
        } else {
            console.log('👤 Regular user, no admin dashboard');
        }
        
    } else {
        // User is not logged in
        console.log('👤 No user logged in');
        
        // Desktop Auth Buttons
        if (authButtons) {
            authButtons.innerHTML = `
                <button class="btn btn-primary" id="loginBtn">Login</button>
                <button class="btn btn-secondary" id="registerBtn">Register</button>
            `;
        }
        
        // Mobile Auth Buttons
        if (mobileAuthButtons) {
            mobileAuthButtons.innerHTML = `
                <button class="btn btn-primary btn-full" id="mobileLoginBtn">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button class="btn btn-secondary btn-full" id="mobileRegisterBtn">
                    <i class="fas fa-user-plus"></i> Register
                </button>
            `;
        }
        
        // Re-attach event listeners to new buttons
        setTimeout(() => {
            const newLoginBtn = document.getElementById('loginBtn');
            const newRegisterBtn = document.getElementById('registerBtn');
            const newMobileLoginBtn = document.getElementById('mobileLoginBtn');
            const newMobileRegisterBtn = document.getElementById('mobileRegisterBtn');
            
            if (newLoginBtn) newLoginBtn.addEventListener('click', showLogin);
            if (newRegisterBtn) newRegisterBtn.addEventListener('click', showRegister);
            if (newMobileLoginBtn) newMobileLoginBtn.addEventListener('click', function() {
                showLogin();
                closeMobileMenu();
            });
            if (newMobileRegisterBtn) newMobileRegisterBtn.addEventListener('click', function() {
                showRegister();
                closeMobileMenu();
            });
        }, 100);
    }
}

// Check auth status on page load
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const activeSession = sessionStorage.getItem('naiduCarRentalsActiveSession');
    
    if (token && userData && activeSession) {
        try {
            currentUser = JSON.parse(userData);
            console.log('🔑 User session found:', currentUser.name);
            initializeSessionManagement();
            updateUI();
            loadUserBookings();
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
        }
    } else if (token && userData && !activeSession) {
        console.log('⏰ Session expired - auto logging out');
        logout();
    } else {
        console.log('🔑 No active user session found');
        updateUI();
    }
}

// Logout function
function logout() {
    const userName = currentUser?.name || 'User';
    showTemporaryNotification(`👋 Goodbye, ${userName}!`, 'info');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('naiduCarRentalsActiveSession');
    
    currentUser = null;
    bookings = [];
    
    updateUI();
    displayBookings();
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

// Scroll to cars section
function scrollToCars() {
    document.getElementById('cars').scrollIntoView({ behavior: 'smooth' });
}

// Session management
function initializeSessionManagement() {
    if (currentUser) {
        sessionStorage.setItem('naiduCarRentalsActiveSession', 'true');
    }
}

// Show temporary notification
function showTemporaryNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.temporary-notification');
    existingNotifications.forEach(notif => notif.remove());
    
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
        max-width: 90vw;
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

// Add notification styles
function addNotificationStyles() {
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-100%);
                }
            }
            
            .temporary-notification {
                font-family: 'Poppins', sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        showLoading('bookingsContainer', 'Cancelling booking...');
        
        const response = await mobileFetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
            method: 'PUT'
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

// Mark booking as completed
async function markBookingAsCompleted(bookingId) {
    if (!confirm('Are you sure you want to mark this booking as completed?')) {
        return;
    }

    try {
        showLoading('bookingsContainer', 'Marking booking as completed...');
        
        const response = await mobileFetch(`${API_BASE}/bookings/${bookingId}/complete`, {
            method: 'PUT'
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

console.log('✅ Naidu Car Rentals Frontend loaded successfully!');