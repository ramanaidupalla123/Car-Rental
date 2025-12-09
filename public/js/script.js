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

// Enhanced fetch with mobile error handling - UPDATED VERSION
async function mobileFetch(url, options = {}) {
  try {
    console.log('📡 API Call:', url, options.method || 'GET');
    
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
      console.error('❌ API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        error: errorText
      });
      
      // Try to parse error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If not JSON, use the text as is
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
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
    initializeCleanSearch();
    clearSearchInputOnLoad();
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

// Reviews & Ratings Functions - BACKEND INTEGRATED
let currentReviewsPage = 1;
let hasMoreReviews = true;
let currentReviewType = 'all';

// Initialize mock reviews data with localStorage persistence
function initializeMockReviews() {
    console.log('📝 Initializing mock reviews data...');
    
    // Try to load reviews from localStorage first
    const savedReviews = localStorage.getItem('carRentalReviews');
    
    if (savedReviews) {
        try {
            mockReviews = JSON.parse(savedReviews);
            console.log(`✅ Loaded ${mockReviews.length} reviews from localStorage`);
        } catch (error) {
            console.error('❌ Error loading reviews from localStorage:', error);
            mockReviews = [];
        }
    }
    
    // If no saved reviews, initialize with empty array (no default reviews)
    if (mockReviews.length === 0) {
        mockReviews = [];
        console.log('✅ Initialized empty reviews array');
    }
    
    // Save to localStorage to ensure it exists
    saveReviewsToStorage();
}

// Save reviews to localStorage
function saveReviewsToStorage() {
    try {
        localStorage.setItem('carRentalReviews', JSON.stringify(mockReviews));
        console.log(`💾 Saved ${mockReviews.length} reviews to localStorage`);
    } catch (error) {
        console.error('❌ Error saving reviews to localStorage:', error);
    }
}

// Setup star rating
function setupStarRating() {
    console.log('⭐ Setting up star rating...');
    
    const websiteRating = document.querySelector('#websiteReviewForm .star-rating-forward');
    if (websiteRating) {
        setupSingleStarRating(websiteRating);
    }
    
    const carRating = document.querySelector('#carReviewForm .star-rating-forward');
    if (carRating) {
        setupSingleStarRating(carRating);
    }
    
    console.log('✅ Star rating setup completed');
}


// Setup single star rating component - FIXED PROPER ORDER
function setupSingleStarRating(ratingContainer) {
    const stars = ratingContainer.querySelectorAll('input[type="radio"]');
    const labels = Array.from(ratingContainer.querySelectorAll('label'));
    
    // Keep labels in original order (left to right: 1,2,3,4,5)
    // No reversal needed
    
    stars.forEach((star, index) => {
        // Set proper rating value (index 0 = 1 star, index 4 = 5 stars)
        const ratingValue = index + 1;
        star.value = ratingValue;
        
        star.addEventListener('change', function() {
            console.log(`⭐ Star ${ratingValue} selected (index: ${index})`);
            // Update star colors - select all stars up to the clicked one
            labels.forEach((label, labelIndex) => {
                if (labelIndex <= index) {
                    label.style.color = '#ffc107';
                    label.style.textShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
                } else {
                    label.style.color = '#e4e5e9';
                    label.style.textShadow = 'none';
                }
            });
        });
        
        // Add hover effect
        star.addEventListener('mouseenter', function() {
            labels.forEach((label, labelIndex) => {
                if (labelIndex <= index) {
                    label.style.transform = 'scale(1.2)';
                    label.style.color = '#ffd54f';
                }
            });
        });
        
        star.addEventListener('mouseleave', function() {
            labels.forEach((label, labelIndex) => {
                label.style.transform = 'scale(1)';
                // Restore actual selected state
                const checkedStar = ratingContainer.querySelector('input[type="radio"]:checked');
                if (checkedStar) {
                    const checkedIndex = Array.from(stars).indexOf(checkedStar);
                    if (labelIndex <= checkedIndex) {
                        label.style.color = '#ffc107';
                    } else {
                        label.style.color = '#e4e5e9';
                    }
                } else {
                    label.style.color = '#e4e5e9';
                }
            });
        });
    });
    
    // Add click effect to labels - use original order
    labels.forEach((label, index) => {
        label.addEventListener('click', function() {
            const ratingValue = index + 1;
            console.log(`⭐ Label clicked - rating: ${ratingValue}`);
            // Trigger the corresponding radio button
            stars[index].checked = true;
            stars[index].dispatchEvent(new Event('change'));
        });
    });
}

// Load all reviews from backend
async function loadAllReviews(reset = true) {
    console.log('📝 Loading all reviews from backend...');
    
    try {
        const container = document.getElementById('allReviewsList');
        if (!container) {
            console.error('❌ allReviewsList container not found!');
            return;
        }
        
        if (reset) {
            currentReviewsPage = 1;
            hasMoreReviews = true;
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading reviews...</p></div>';
        }
        
        const typeFilter = document.getElementById('reviewTypeFilter')?.value || 'all';
        const sortFilter = document.getElementById('reviewSortFilter')?.value || 'newest';
        const ratingFilter = document.getElementById('reviewRatingFilter')?.value || 'all';
        
        console.log(`📝 Filters - Type: ${typeFilter}, Sort: ${sortFilter}, Rating: ${ratingFilter}`);
        
        // Build API URL with filters
        let url = `${API_BASE}/reviews?`;
        const params = new URLSearchParams();
        
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (sortFilter) params.append('sort', sortFilter);
        if (ratingFilter !== 'all') params.append('rating', ratingFilter);
        params.append('page', currentReviewsPage);
        params.append('limit', '10');
        
        url += params.toString();
        
        const response = await mobileFetch(url);
        const result = await response.json();
        
        if (result.success) {
            displayAllReviews(result.reviews, reset);
            hasMoreReviews = currentReviewsPage < result.pages;
            console.log(`✅ Loaded ${result.reviews.length} reviews from backend`);
        } else {
            throw new Error(result.message || 'Failed to load reviews');
        }
    } catch (error) {
        console.error('❌ Error loading reviews:', error);
        const container = document.getElementById('allReviewsList');
        if (container) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Reviews</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

// Load reviews overview from backend - FIXED VERSION
async function loadReviewsOverview() {
    console.log('📊 Loading reviews overview from backend...');
    
    try {
        // Get all ACTIVE reviews to calculate stats (matching admin panel)
        const response = await mobileFetch(`${API_BASE}/reviews?limit=1000`);
        const result = await response.json();
        
        if (result.success) {
            const reviews = result.reviews;
            const totalReviews = result.total || reviews.length;
            const carReviews = reviews.filter(review => review.type === 'car').length;
            const websiteReviews = reviews.filter(review => review.type === 'website').length;
            const averageRating = reviews.length > 0 
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : '0.0';

            // Update overview stats
            const websiteRatingElem = document.getElementById('websiteRating');
            const totalReviewsElem = document.getElementById('totalReviews');
            const carReviewsElem = document.getElementById('carReviews');
            
            if (websiteRatingElem) websiteRatingElem.textContent = averageRating;
            if (totalReviewsElem) totalReviewsElem.textContent = totalReviews;
            if (carReviewsElem) carReviewsElem.textContent = carReviews;
            
            console.log(`📊 User Reviews Overview: ${totalReviews} total, ${carReviews} car, ${websiteReviews} website, avg ${averageRating}`);
        }
    } catch (error) {
        console.error('❌ Error loading reviews overview:', error);
        // Set default values
        const websiteRatingElem = document.getElementById('websiteRating');
        const totalReviewsElem = document.getElementById('totalReviews');
        const carReviewsElem = document.getElementById('carReviews');
        
        if (websiteRatingElem) websiteRatingElem.textContent = '0.0';
        if (totalReviewsElem) totalReviewsElem.textContent = '0';
        if (carReviewsElem) carReviewsElem.textContent = '0';
    }
}

// Load user's reviews from backend
async function loadMyReviews() {
    console.log('📝 Loading my reviews from backend...');
    
    const container = document.getElementById('myReviewsContainer');
    if (!container) {
        console.error('❌ myReviewsContainer not found!');
        return;
    }
    
    if (!currentUser) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-key"></i>
                <h3>Please Login</h3>
                <p>Login to view your reviews and ratings</p>
                <button class="btn btn-primary" onclick="showLogin()">Login Now</button>
            </div>
        `;
        return;
    }
    
    try {
        const response = await mobileFetch(`${API_BASE}/reviews/my-reviews`);
        const result = await response.json();
        
        if (result.success) {
            displayMyReviews(result.reviews);
            console.log(`✅ Loaded ${result.reviews.length} user reviews from backend`);
        } else {
            throw new Error(result.message || 'Failed to load user reviews');
        }
    } catch (error) {
        console.error('❌ Error loading user reviews:', error);
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Reviews</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Handle website review submission - ENHANCED DEBUG VERSION
async function handleWebsiteReview(e) {
    e.preventDefault();
    console.log('🌐 WEBSITE REVIEW: Starting website review submission...');
    
    // Prevent multiple submissions
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton.disabled) {
        console.log('⚠️ Form already submitting...');
        return;
    }
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    if (!currentUser) {
        showNotification('Please login to submit a review', 'warning');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        showLogin();
        return;
    }
    
    const rating = document.querySelector('input[name="website-rating"]:checked');
    const titleInput = document.getElementById('websiteReviewTitle');
    const commentInput = document.getElementById('websiteReviewComment');
    
    // Debug: Log all form values
    console.log('🌐 WEBSITE REVIEW: Form values:', {
        rating: rating ? rating.value : 'NOT SELECTED',
        title: titleInput ? titleInput.value : 'MISSING',
        comment: commentInput ? commentInput.value : 'MISSING'
    });
    
    if (!titleInput || !commentInput) {
        console.error('❌ WEBSITE REVIEW: Form elements not found');
        showNotification('Review form elements not found', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    const title = titleInput.value.trim();
    const comment = commentInput.value.trim();
    
    if (!rating) {
        showNotification('Please select a rating', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    if (!title) {
        showNotification('Please enter a review title', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    if (!comment) {
        showNotification('Please enter your review comments', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }

    try {
        const selectedRating = parseInt(rating.value);
        console.log(`🌐 WEBSITE REVIEW: Submitting with rating: ${selectedRating}`);
        
        // EXPLICITLY SET TYPE TO WEBSITE
        const reviewData = {
            type: 'website', // THIS IS CRITICAL - EXPLICITLY SET TO WEBSITE
            rating: selectedRating,
            title: title,
            comment: comment
        };
        
        console.log('🌐 WEBSITE REVIEW: Final data being sent to server:', reviewData);
        
        const response = await mobileFetch(`${API_BASE}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });

        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ WEBSITE REVIEW: Server response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('🌐 WEBSITE REVIEW: Server response:', result);

        if (result.success) {
            showNotification('✅ Website review submitted successfully!', 'success');
            
            // Reset form
            const websiteForm = document.getElementById('websiteReviewFormElement');
            if (websiteForm) {
                websiteForm.reset();
            }
            resetStarRating('website');
            
            // Refresh reviews immediately
            loadAllReviews();
            loadMyReviews();
            loadReviewsOverview();
            
            console.log('✅ WEBSITE REVIEW: Successfully submitted and saved to database');
        } else {
            throw new Error(result.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('❌ WEBSITE REVIEW: Error submitting review:', error);
        showNotification('Error submitting review: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
    }
}

// Handle car review submission - ENHANCED DEBUG VERSION
async function handleCarReview(e) {
    e.preventDefault();
    console.log('🚗 CAR REVIEW: Starting car review submission...');
    
    // Prevent multiple submissions
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton.disabled) {
        console.log('⚠️ Form already submitting...');
        return;
    }
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    if (!currentUser) {
        showNotification('Please login to submit a review', 'warning');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        showLogin();
        return;
    }
    
    // Get form elements
    const rating = document.querySelector('input[name="car-rating"]:checked');
    const titleInput = document.getElementById('carReviewTitle');
    const commentInput = document.getElementById('carReviewComment');
    const carIdInput = document.getElementById('selectedCarId');
    const bookingIdInput = document.getElementById('selectedBookingId');
    
    // Debug: Log all form values
    console.log('🚗 CAR REVIEW: Form values:', {
        rating: rating ? rating.value : 'NOT SELECTED',
        title: titleInput ? titleInput.value : 'MISSING',
        comment: commentInput ? commentInput.value : 'MISSING',
        carId: carIdInput ? carIdInput.value : 'MISSING',
        bookingId: bookingIdInput ? bookingIdInput.value : 'MISSING'
    });
    
    if (!titleInput || !commentInput) {
        console.error('❌ CAR REVIEW: Form elements not found');
        showNotification('Review form elements not found', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    const title = titleInput.value.trim();
    const comment = commentInput.value.trim();
    const carId = carIdInput ? carIdInput.value : null;
    const bookingId = bookingIdInput ? bookingIdInput.value : null;
    
    // Validation
    if (!rating) {
        showNotification('Please select a rating', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    if (!title) {
        showNotification('Please enter a review title', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    if (!comment) {
        showNotification('Please enter your review comments', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }
    
    if (!carId || !bookingId) {
        showNotification('Please select a booking to review', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
        return;
    }

    try {
        const selectedRating = parseInt(rating.value);
        console.log(`🚗 CAR REVIEW: Submitting with rating: ${selectedRating}`);
        
        // EXPLICITLY SET TYPE TO CAR
        const reviewData = {
            type: 'car', // THIS IS CRITICAL - EXPLICITLY SET TO CAR
            rating: selectedRating,
            title: title,
            comment: comment,
            carId: carId,
            bookingId: bookingId
        };
        
        console.log('🚗 CAR REVIEW: Final data being sent to server:', reviewData);
        
        const response = await mobileFetch(`${API_BASE}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });

        // Check if response is ok
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ CAR REVIEW: Server response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('🚗 CAR REVIEW: Server response:', result);

        if (result.success) {
            showNotification('✅ Car review submitted successfully!', 'success');
            
            // Reset form
            const carForm = document.getElementById('carReviewFormElement');
            if (carForm) {
                carForm.reset();
                carForm.style.display = 'none';
            }
            resetStarRating('car');
            
            // Reset select
            const selectBooking = document.getElementById('selectBooking');
            if (selectBooking) {
                selectBooking.value = '';
            }
            
            // Refresh all data
            loadAllReviews();
            loadMyReviews();
            loadReviewsOverview();
            loadBookingsForReview();
            displayBookings();
            
            console.log('✅ CAR REVIEW: Successfully submitted and saved to database');
        } else {
            throw new Error(result.message || 'Failed to submit review');
        }
    } catch (error) {
        console.error('❌ CAR REVIEW: Error submitting review:', error);
        showNotification('Error submitting review: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
    }
}

// Debug function to check which form is active
function checkActiveReviewForm() {
    const websiteForm = document.querySelector('#websiteReviewForm.active');
    const carForm = document.querySelector('#carReviewForm.active');
    const websiteFormElement = document.getElementById('websiteReviewFormElement');
    const carFormElement = document.getElementById('carReviewFormElement');
    
    console.log('🔍 FORM VISIBILITY CHECK:', {
        'Website Form (active class)': !!websiteForm,
        'Car Form (active class)': !!carForm,
        'Website Form Element exists': !!websiteFormElement,
        'Car Form Element exists': !!carFormElement,
        'Website Form display style': websiteFormElement ? websiteFormElement.style.display : 'N/A',
        'Car Form display style': carFormElement ? carFormElement.style.display : 'N/A'
    });
    
    return {
        websiteActive: !!websiteForm,
        carActive: !!carForm
    };
}


// Reset star rating - FIXED PROPER ORDER
function resetStarRating(type) {
    console.log(`⭐ Resetting ${type} star rating`);
    
    const stars = document.querySelectorAll(`input[name="${type}-rating"]`);
    const labels = document.querySelectorAll(`.star-rating-forward input[name="${type}-rating"] + label`);
    
    stars.forEach(star => star.checked = false);
    labels.forEach(label => {
        label.style.color = '#e4e5e9';
        label.style.textShadow = 'none';
        label.style.transform = 'scale(1)';
    });
}

// Show reviews page - ENSURE LATEST DATA LOADS
function showReviewsPage() {
    console.log('📝 Showing reviews page...');
    
    // Hide all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show reviews section
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) {
        reviewsSection.style.display = 'block';
    } else {
        console.error('❌ Reviews section not found!');
        return;
    }
    
    // Always reload from localStorage to get latest data
    const savedReviews = localStorage.getItem('carRentalReviews');
    if (savedReviews) {
        try {
            mockReviews = JSON.parse(savedReviews);
            console.log(`📝 Loaded ${mockReviews.length} reviews from localStorage for reviews page`);
        } catch (error) {
            console.error('❌ Error loading reviews from localStorage for reviews page:', error);
        }
    }
    
    // Load reviews data
    loadReviewsOverview();
    loadAllReviews();
    setupReviewsTabs();
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    console.log('✅ Reviews page loaded successfully');
}



// Setup reviews tabs - FIXED VERSION
function setupReviewsTabs() {
    console.log('📝 Setting up reviews tabs...');
    
    // Tab switching
    document.querySelectorAll('.reviews-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log(`📝 Switching to tab: ${tabName}`);
            
            // Update active tab button
            document.querySelectorAll('.reviews-tabs .tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('#reviews .tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            const targetTab = document.getElementById(tabName);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // Load tab-specific content
            switch(tabName) {
                case 'all-reviews':
                    loadAllReviews();
                    break;
                case 'my-reviews':
                    loadMyReviews();
                    break;
                case 'write-review':
                    setupWriteReviewTab();
                    break;
            }
        });
    });
    
    // Review type switching - ENHANCED DEBUG VERSION
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            console.log(`📝 Switching to review type: ${type}`);
            
            // Update active type button
            document.querySelectorAll('.type-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show corresponding form
            const websiteForm = document.getElementById('websiteReviewForm');
            const carForm = document.getElementById('carReviewForm');
            
            if (websiteForm) {
                websiteForm.classList.remove('active');
                console.log('🌐 Website form hidden');
            }
            if (carForm) {
                carForm.classList.remove('active');
                console.log('🚗 Car form hidden');
            }
            
            if (type === 'website') {
                if (websiteForm) {
                    websiteForm.classList.add('active');
                    console.log('✅ Website review form activated and visible');
                }
            } else {
                if (carForm) {
                    carForm.classList.add('active');
                    console.log('✅ Car review form activated and visible');
                    loadBookingsForReview();
                }
            }
            
            // Debug: Check which form is actually visible
            setTimeout(() => {
                const activeWebsiteForm = document.querySelector('#websiteReviewForm.active');
                const activeCarForm = document.querySelector('#carReviewForm.active');
                console.log('🔍 Current active forms:', {
                    website: !!activeWebsiteForm,
                    car: !!activeCarForm
                });
                
                // Additional form visibility check
                checkActiveReviewForm();
            }, 100);
        });
    });
    
    // Setup star rating
    setupStarRating();
    
    // Form submissions - FIXED VERSION
    const websiteReviewForm = document.getElementById('websiteReviewFormElement');
    const carReviewForm = document.getElementById('carReviewFormElement');

    if (websiteReviewForm) {
        websiteReviewForm.addEventListener('submit', function(e) {
            console.log('🌐 Website review form submitted');
            handleWebsiteReview(e);
        });
        console.log('✅ Website review form event listener added');
    }

    if (carReviewForm) {
        carReviewForm.addEventListener('submit', function(e) {
            console.log('🚗 Car review form submitted - checking data');
            
            // Debug: Check what form is being submitted
            const rating = document.querySelector('input[name="car-rating"]:checked');
            const title = document.getElementById('carReviewTitle').value;
            const carIdInput = document.getElementById('selectedCarId');
            const bookingIdInput = document.getElementById('selectedBookingId');
            
            console.log('🚗 Car review form data:', {
                rating: rating ? rating.value : 'none',
                title: title,
                carId: carIdInput ? carIdInput.value : 'none',
                bookingId: bookingIdInput ? bookingIdInput.value : 'none'
            });
            
            handleCarReview(e);
        });
        console.log('✅ Car review form event listener added');
    }
    
    // Filter changes
    const typeFilter = document.getElementById('reviewTypeFilter');
    const sortFilter = document.getElementById('reviewSortFilter');
    const ratingFilter = document.getElementById('reviewRatingFilter');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', loadAllReviews);
        console.log('✅ Type filter event listener added');
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', loadAllReviews);
        console.log('✅ Sort filter event listener added');
    }
    if (ratingFilter) {
        ratingFilter.addEventListener('change', loadAllReviews);
        console.log('✅ Rating filter event listener added');
    }
    
    console.log('✅ Reviews tabs setup completed');
}



// Display all reviews - FIXED VERSION
function displayAllReviews(reviews, reset) {
    const container = document.getElementById('allReviewsList');
    if (!container) {
        console.error('❌ allReviewsList container not found!');
        return;
    }
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-star"></i>
                <h3>No Reviews Yet</h3>
                <p>Be the first to share your experience!</p>
            </div>
        `;
        return;
    }
    
    let reviewsHTML = '';
    
    reviews.forEach(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const timeAgo = getTimeAgo(review.createdAt);
        
        // FIX: Properly display review type with correct styling
        const isCarReview = review.type === 'car';
        const typeBadgeClass = isCarReview ? 'car' : 'website';
        const typeIcon = isCarReview ? 'fas fa-car' : 'fas fa-globe';
        const typeText = isCarReview ? 'Car Review' : 'Website Review';
        
        reviewsHTML += `
            <div class="review-card" data-review-id="${review._id}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" 
                             alt="${review.user.name}" class="reviewer-avatar">
                        <div class="reviewer-details">
                            <div class="reviewer-name">${review.user.name}</div>
                            <div class="review-date">${timeAgo}</div>
                        </div>
                    </div>
                    <div class="review-type-badge ${typeBadgeClass}">
                        <i class="${typeIcon}"></i> ${typeText}
                    </div>
                </div>
                
                <div class="review-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-text">${review.rating}.0</span>
                </div>
                
                <h4 class="review-title">${review.title}</h4>
                <p class="review-comment">${review.comment}</p>
                
                ${isCarReview && review.car ? `
                    <div class="reviewed-car">
                        <small><i class="fas fa-car"></i> Reviewed: ${review.car.make} ${review.car.model}</small>
                    </div>
                ` : ''}
                
                <div class="review-actions">
                    <button class="helpful-btn" onclick="markReviewHelpful('${review._id}')">
                        <i class="fas fa-thumbs-up"></i>
                        Helpful (${review.helpfulCount || 0})
                    </button>
                    <button class="report-btn" onclick="reportReview('${review._id}')">
                        <i class="fas fa-flag"></i> Report
                    </button>
                </div>
                
                ${review.isVerified ? `
                    <div class="verified-badge">
                        <i class="fas fa-check-circle"></i> Verified Review
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = reviewsHTML;
    console.log(`✅ Displayed ${reviews.length} reviews with correct types`);
}



// Display user's reviews
function displayMyReviews(reviews) {
    const container = document.getElementById('myReviewsContainer');
    if (!container) return;
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-star"></i>
                <h3>No Reviews Yet</h3>
                <p>You haven't submitted any reviews yet.</p>
                <button class="btn btn-primary" onclick="switchToWriteReview()">Write Your First Review</button>
            </div>
        `;
        return;
    }
    
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    container.innerHTML = `
        <div class="my-reviews-stats">
            <div class="stat-item">
                <span class="stat-number">${reviews.length}</span>
                <span class="stat-label">Total Reviews</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${averageRating.toFixed(1)}</span>
                <span class="stat-label">Average Rating</span>
            </div>
        </div>
        <div class="my-reviews-list">
            ${reviews.map(review => {
                const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                const timeAgo = getTimeAgo(review.createdAt);
                
                return `
                    <div class="my-review-card">
                        <div class="review-header">
                            <div class="review-type-badge ${review.type}">
                                ${review.type === 'car' ? '<i class="fas fa-car"></i> Car Review' : '<i class="fas fa-globe"></i> Website Review'}
                            </div>
                            <div class="review-actions">
                                <button class="btn btn-small btn-danger" onclick="deleteMyReview('${review._id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        
                        <div class="review-rating">
                            <div class="stars">${stars}</div>
                            <span class="rating-text">${review.rating}.0</span>
                            <span class="review-date">${timeAgo}</span>
                        </div>
                        
                        <h4 class="review-title">${review.title}</h4>
                        <p class="review-comment">${review.comment}</p>
                        
                        ${review.type === 'car' && review.car ? `
                            <div class="reviewed-car">
                                <strong>Car:</strong> ${review.car.make} ${review.car.model}
                            </div>
                        ` : ''}
                        
                        <div class="review-stats">
                            <span><i class="fas fa-thumbs-up"></i> ${review.helpfulCount || 0} helpful</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}



// Show selected car info - UPDATED
function showSelectedCarInfo(car, bookingId) {
    console.log('🚗 Showing selected car info:', car.make, car.model);
    
    const container = document.getElementById('selectedCarInfo');
    if (!container) {
        console.error('❌ selectedCarInfo container not found!');
        return;
    }
    
    if (!car || !bookingId) {
        container.innerHTML = `
            <div class="no-car-selected">
                <i class="fas fa-car"></i>
                <p>Please select a booking to review</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="selected-car-display">
            <img src="${getCarImage(car)}" alt="${car.make} ${car.model}" class="car-image-small">
            <div class="car-details">
                <h5>${car.make} ${car.model} (${car.year})</h5>
                <p>${car.type} • ${car.fuelType || 'Petrol'} • ${car.transmission || 'Manual'}</p>
                <input type="hidden" id="selectedCarId" value="${car._id}">
                <input type="hidden" id="selectedBookingId" value="${bookingId}">
            </div>
        </div>
    `;
}



// Delete user's review - BACKEND INTEGRATED
async function deleteMyReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        return;
    }
    
    console.log(`🗑️ Deleting review ${reviewId}`);
    
    try {
        const response = await mobileFetch(`${API_BASE}/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('✅ Review deleted successfully!', 'success');
            loadMyReviews();
            loadReviewsOverview();
            loadAllReviews();
        } else {
            throw new Error(result.message || 'Failed to delete review');
        }
    } catch (error) {
        console.error('❌ Error deleting review:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Mark review as helpful - BACKEND INTEGRATED
async function markReviewHelpful(reviewId) {
    console.log(`👍 Marking review ${reviewId} as helpful`);
    
    try {
        const response = await mobileFetch(`${API_BASE}/reviews/${reviewId}/helpful?action=helpful`, {
            method: 'PUT'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Thanks for your feedback!', 'success');
            loadAllReviews();
        } else {
            throw new Error(result.message || 'Failed to mark review as helpful');
        }
    } catch (error) {
        console.error('❌ Error marking review as helpful:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}




// Report review
function reportReview(reviewId) {
    console.log(`🚩 Reporting review ${reviewId}`);
    
    const review = mockReviews.find(r => r._id === reviewId);
    if (review) {
        review.reportCount = (review.reportCount || 0) + 1;
        saveReviewsToStorage(); // Save changes
        showNotification('Review reported. Thank you for helping us maintain quality content.', 'success');
    }
}



// Switch to write review tab
function switchToWriteReview() {
    console.log('📝 Switching to write review tab');
    
    document.querySelectorAll('.reviews-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === 'write-review') {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('#reviews .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const writeReviewTab = document.getElementById('write-review');
    if (writeReviewTab) {
        writeReviewTab.classList.add('active');
    }
    
    setupWriteReviewTab();
}

// Load more reviews
function loadMoreReviews() {
    console.log('📝 Loading more reviews...');
    showNotification('All reviews loaded', 'info');
}

// Get all reviews for admin panel
function getAllReviewsForAdmin() {
    return mockReviews;
}

// Utility function to get time ago
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

// Load bookings for review - FIXED VERSION
async function loadBookingsForReview() {
    console.log('📝 Loading bookings for review...');
    
    const select = document.getElementById('selectBooking');
    const carForm = document.getElementById('carReviewForm');
    
    if (!select || !carForm) {
        console.error('❌ Review form elements not found');
        return;
    }
    
    // Reset the form initially
    carForm.style.display = 'none';
    select.innerHTML = '<option value="">Select a booking to review...</option>';
    
    if (!currentUser) {
        select.innerHTML = '<option value="">Please login to review</option>';
        showNotification('Please login to submit a car review', 'warning');
        return;
    }
    
    try {
        // Get user's completed bookings that haven't been reviewed
        const response = await mobileFetch(`${API_BASE}/bookings/my-bookings`);
        const result = await response.json();
        
        if (result.success) {
            const reviewableBookings = result.bookings.filter(booking => 
                booking.status === 'completed'
            );
            
            console.log(`📝 Found ${reviewableBookings.length} reviewable bookings`);
            
            if (reviewableBookings.length === 0) {
                select.innerHTML = `
                    <option value="">
                        No completed bookings available for review
                    </option>
                `;
                document.getElementById('selectedCarInfo').innerHTML = `
                    <div class="no-car-selected">
                        <i class="fas fa-calendar-check"></i>
                        <p>No completed bookings found</p>
                        <small>Complete a rental first to leave a review</small>
                    </div>
                `;
                return;
            }
            
            // Populate the dropdown with available bookings
            reviewableBookings.forEach(booking => {
                const option = document.createElement('option');
                option.value = booking._id;
                
                // Store car data for later use
                const carData = {
                    _id: booking.car?._id || booking.carId,
                    make: booking.car?.make || 'Car',
                    model: booking.car?.model || '',
                    year: booking.car?.year || new Date().getFullYear(),
                    type: booking.car?.type || 'Vehicle',
                    fuelType: booking.car?.fuelType || 'Petrol',
                    transmission: booking.car?.transmission || 'Manual',
                    images: booking.car?.images || [{ url: getCarImage(booking.car) }]
                };
                
                option.setAttribute('data-car', JSON.stringify(carData));
                
                // Format the display text
                const carName = `${carData.make} ${carData.model}`;
                const dates = `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`;
                
                option.textContent = `${carName} (Rented: ${dates})`;
                select.appendChild(option);
            });
            
            // Add event listener for selection change
            select.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                
                if (selectedOption.value) {
                    const carData = JSON.parse(selectedOption.getAttribute('data-car'));
                    showSelectedCarInfo(carData, selectedOption.value);
                    carForm.style.display = 'block';
                    resetStarRating('car');
                } else {
                    carForm.style.display = 'none';
                    document.getElementById('selectedCarInfo').innerHTML = `
                        <div class="no-car-selected">
                            <i class="fas fa-car"></i>
                            <p>Please select a booking to review</p>
                        </div>
                    `;
                }
            });
            
            console.log('✅ Bookings dropdown populated successfully');
        } else {
            throw new Error(result.message || 'Failed to load bookings');
        }
    } catch (error) {
        console.error('❌ Error loading bookings for review:', error);
        select.innerHTML = '<option value="">Error loading bookings</option>';
    }
}

// Setup write review tab
function setupWriteReviewTab() {
    console.log('📝 Setting up write review tab...');
    
    // Reset forms
    const websiteForm = document.getElementById('websiteReviewForm');
    const carForm = document.getElementById('carReviewForm');
    
    if (websiteForm) {
        websiteForm.classList.add('active');
        websiteForm.style.display = 'block';
    }
    
    if (carForm) {
        carForm.classList.remove('active');
        carForm.style.display = 'none';
    }
    
    // Reset star ratings
    resetStarRating('website');
    resetStarRating('car');
    
    // Load bookings for car reviews
    loadBookingsForReview();
    
    console.log('✅ Write review tab setup completed');
}

// Enhanced displayBookings function to track review status
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
        // Check if this booking has been reviewed
        const hasBeenReviewed = mockReviews.some(review => 
            review.bookingId === booking._id || 
            (review.car && review.car._id === (booking.car?._id || booking.carId))
        );
        
        const canReview = booking.status === 'completed' && !hasBeenReviewed;
        
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
                    
                    ${canReview ? 
                        `<button class="btn btn-primary btn-small" onclick="showReviewForBooking('${booking._id}')">
                            <i class="fas fa-star"></i> Rate Experience
                        </button>` : ''}
                    
                    ${hasBeenReviewed ? 
                        `<span class="reviewed-badge">
                            <i class="fas fa-check-circle"></i> Reviewed
                        </span>` : ''}
                </div>
            </div>
        </div>
    `}).join('');
}

// Show review for specific booking
function showReviewForBooking(bookingId) {
    console.log(`📝 Showing review form for booking: ${bookingId}`);
    
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) {
        showNotification('Booking not found', 'error');
        return;
    }
    
    // Switch to reviews section and write review tab
    showReviewsPage();
    
    // Switch to car review type
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === 'car') {
            btn.classList.add('active');
        }
    });
    
    const websiteForm = document.getElementById('websiteReviewForm');
    const carForm = document.getElementById('carReviewForm');
    
    if (websiteForm) websiteForm.classList.remove('active');
    if (carForm) carForm.classList.add('active');
    
    // Pre-select the booking in dropdown
    const select = document.getElementById('selectBooking');
    if (select) {
        // First load all bookings
        loadBookingsForReview();
        
        // Then select the specific booking
        setTimeout(() => {
            const option = Array.from(select.options).find(opt => 
                opt.value === bookingId
            );
            if (option) {
                select.value = bookingId;
                select.dispatchEvent(new Event('change'));
            }
        }, 100);
    }
}




// Close reviews page - GO TO INDEX.HTML
function closeReviewsPage() {
    console.log('📝 Closing reviews page and redirecting to index.html...');
    window.location.href = 'index.html';
}

// Go back to home - GO TO INDEX.HTML
function goBackToHome() {
    console.log('📝 Going back to index.html...');
    window.location.href = 'index.html';
}

console.log('✅ Naidu Car Rentals Frontend loaded successfully!');

// Clean Search Functions - FIXED VERSION
function performSearch() {
    console.log('🔍 Search button clicked');
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        showNotification('Please enter a car name to search', 'warning');
        searchInput.focus();
        return;
    }
    
    // Basic validation
    if (searchTerm.length < 2) {
        showNotification('Please enter at least 2 characters', 'warning');
        return;
    }
    
    // Disable search button temporarily
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        const searchIcon = searchBtn.innerHTML;
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        searchBtn.disabled = true;
        
        // Add loading state
        const searchContainer = document.querySelector('.search-container-clean');
        if (searchContainer) {
            searchContainer.classList.add('search-loading-clean');
        }
    }
    
    // Show searching notification
    showNotification(`Searching for "${searchTerm}"...`, 'info');
    
    // Wait for 500ms to show loading state, then redirect
    setTimeout(() => {
        const encodedTerm = encodeURIComponent(searchTerm);
        console.log(`Redirecting to search results with query: ${encodedTerm}`);
        
        // Redirect to search results page
        window.location.href = `search-results.html?q=${encodedTerm}`;
        
        // Note: These won't execute because page navigates away
    }, 600);
}

// REMOVE THIS FUNCTION - We don't want Enter key to trigger search
// function handleSearchKeyPress(event) {
//     if (event.key === 'Enter') {
//         event.preventDefault();
//         performSearch();
//     }
// }

function setupVoiceSearchClean() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (!voiceBtn) return;
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';
        
        voiceBtn.addEventListener('click', function() {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
                voiceBtn.classList.remove('listening');
                showNotification('Voice search stopped', 'info');
                return;
            }
            
            recognition.start();
            voiceBtn.classList.add('listening');
            showNotification('🎤 Listening... Speak now', 'info');
        });
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const searchInput = document.getElementById('searchInput');
            searchInput.value = transcript;
            voiceBtn.classList.remove('listening');
            
            // Auto-focus and select text
            searchInput.focus();
            searchInput.select();
            
            showNotification(`✅ Heard: "${transcript}"`, 'success');
            
            // IMPORTANT: Voice search DOES NOT auto-submit
            // User must click the search button to search
        };
        
        recognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            voiceBtn.classList.remove('listening');
            
            let errorMessage = 'Voice recognition failed';
            if (event.error === 'no-speech') {
                errorMessage = 'No speech detected';
            } else if (event.error === 'audio-capture') {
                errorMessage = 'No microphone found';
            } else if (event.error === 'not-allowed') {
                errorMessage = 'Microphone access denied';
            }
            
            showNotification('❌ ' + errorMessage, 'error');
        };
        
        recognition.onend = function() {
            voiceBtn.classList.remove('listening');
        };
    } else {
        voiceBtn.style.display = 'none';
    }
}


// Test function to show it works
function testSearch() {
    console.log('Test: Typing in search box...');
    console.log('This will NOT trigger search');
    console.log('Only clicking the green search button will trigger search');
}


// Add this new function to handle clearing search input
function clearSearchInputOnLoad() {
    console.log('🔄 Clearing search input on page load...');
    
    // Clear the search input field
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        
        // Also clear any search parameters from URL if present
        const url = new URL(window.location.href);
        if (url.searchParams.has('q')) {
            url.searchParams.delete('q');
            window.history.replaceState({}, document.title, url.pathname);
        }
    }
    
    // Clear the clear button state
    const clearBtn = document.querySelector('.clear-btn-clean');
    if (clearBtn) {
        clearBtn.style.opacity = '0';
        clearBtn.style.visibility = 'hidden';
    }
}

function initializeCleanSearch() {
    console.log('🔍 Initializing clean search (button only)...');
    
    // CLEAR SEARCH INPUT ON PAGE LOAD - ADD THIS LINE
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Setup voice search
    setupVoiceSearchClean();
    
    // Add clear button functionality
    if (searchInput) {
        // Create clear button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-btn-clean';
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.type = 'button';
        clearBtn.title = 'Clear search';
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
            this.style.opacity = '0';
            this.style.visibility = 'hidden';
        });
        
        // Insert clear button after input
        const searchContainer = document.querySelector('.search-container-clean');
        if (searchContainer) {
            searchContainer.appendChild(clearBtn);
        }
        
        // Show/hide clear button
        searchInput.addEventListener('input', function() {
            if (clearBtn) {
                clearBtn.style.opacity = this.value ? '1' : '0';
                clearBtn.style.visibility = this.value ? 'visible' : 'hidden';
            }
        });
        
        // REMOVE Enter key event listener - Only button click works
        searchInput.addEventListener('keydown', function(event) {
            // Prevent Enter key from doing anything in search
            if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                // Do nothing - search only on button click
                showNotification('Click the search button to search', 'info');
            }
        });
        
        // Add focus effects
        searchInput.addEventListener('focus', function() {
            const parent = this.parentElement;
            if (parent) {
                parent.style.borderColor = 'var(--green)';
                parent.style.boxShadow = '0 10px 40px rgba(100, 255, 218, 0.2)';
            }
        });
        
        searchInput.addEventListener('blur', function() {
            const parent = this.parentElement;
            if (parent && !this.value) {
                parent.style.borderColor = '#e2e8f0';
                parent.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
            }
        });
    }
    
    // Add keyboard shortcut for focusing only (not searching)
    document.addEventListener('keydown', function(e) {
        // Ctrl+K to focus search (but not search)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape to clear search
        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (document.activeElement === searchInput && searchInput.value) {
                searchInput.value = '';
                const clearBtn = document.querySelector('.clear-btn-clean');
                if (clearBtn) {
                    clearBtn.style.opacity = '0';
                    clearBtn.style.visibility = 'hidden';
                }
            }
        }
    });
    
    console.log('✅ Clean search initialized - Search only on button click');
}

// Clear search on window load (for browser back button)
window.addEventListener('load', function() {
    console.log('📄 Page fully loaded - checking for search cleanup');
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        console.log('🔄 Clearing persisted search input on page load');
        searchInput.value = '';
        
        // Reset clear button
        const clearBtn = document.querySelector('.clear-btn-clean');
        if (clearBtn) {
            clearBtn.style.opacity = '0';
            clearBtn.style.visibility = 'hidden';
        }
    }
});
console.log('✅ Naidu Car Rentals Frontend loaded successfully!');
