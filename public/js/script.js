// API Configuration
const API_BASE = 'http://localhost:10000/api';

// Global variables
let currentUser = null;
let bookings = [];
let cars = [];
let selectedCar = null;
let currentContact = null;
let currentMethod = 'sms';
let otpTimer = null;
let otpTimeLeft = 0;

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
    initializeMobileNavigation();
    addNotificationStyles();
}

// Setup all event listeners
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Auth buttons
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', showLogin);
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegister);
    }
    
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
    const sendOTPForm = document.getElementById('sendOTPForm');
    const verifyOTPForm = document.getElementById('verifyOTPForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }
    if (sendOTPForm) {
        sendOTPForm.addEventListener('submit', handleSendOTP);
    }
    if (verifyOTPForm) {
        verifyOTPForm.addEventListener('submit', handleVerifyOTP);
    }
    
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
        if (e.target.classList.contains('.modal')) {
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

// Mobile Navigation Functions
function initializeMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavLinks = document.getElementById('mobileNavLinks');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const mobileRegisterBtn = document.getElementById('mobileRegisterBtn');

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

    // Mobile auth buttons
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', function() {
            showLogin();
            closeMobileMenu();
        });
    }

    if (mobileRegisterBtn) {
        mobileRegisterBtn.addEventListener('click', function() {
            showRegister();
            closeMobileMenu();
        });
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

// Show forgot password modal - EMAIL ONLY
function showForgotPassword() {
    console.log('🔓 Opening forgot password modal...');
    closeAllModals();
    const sendOTPModal = document.getElementById('sendOTPModal');
    if (sendOTPModal) {
        sendOTPModal.style.display = 'block';
        document.getElementById('sendOTPForm').reset();
        document.getElementById('otpSentSuccess').style.display = 'none';
        document.getElementById('sendOTPForm').style.display = 'block';
        resetOTPTimer();
        
        // Focus on email field
        setTimeout(() => {
            document.getElementById('otpEmail').focus();
        }, 100);
    }
}

// Handle send OTP - EMAIL ONLY VERSION
async function handleSendOTP(e, isResend = false) {
    if (e && e.preventDefault) e.preventDefault();
    
    const email = document.getElementById('otpEmail').value;
    
    console.log('🔍 DEBUG - Email entered by user:', email);

    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    try {
        showLoading('sendOTPModal', isResend ? 'Resending OTP...' : 'Sending OTP...');
        
        const response = await fetch(`${API_BASE}/auth/send-reset-otp`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const result = await response.json();
        console.log('📊 Send OTP response:', result);

        if (result.success) {
            handleOTPSuccess(result, email, isResend);
        } else {
            throw new Error(result.message || 'Failed to send OTP');
        }
    } catch (error) {
        console.error('❌ Send OTP error:', error);
        showNotification(error.message || 'Failed to send OTP. Please try again.', 'error');
        resetLoading('sendOTPModal');
    }
}

// Handle successful OTP sending
function handleOTPSuccess(result, email, isResend) {
    // Hide send form and show success message
    document.getElementById('sendOTPForm').style.display = 'none';
    document.getElementById('otpSentSuccess').style.display = 'block';
    
    // Update success message
    const successMessage = document.getElementById('successMessage');
    
    if (result.provider === 'manual') {
        successMessage.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3 style="color: #d97706; margin-bottom: 1rem;">Email Delivery Issue</h3>
                <p style="color: #6b7280; margin-bottom: 1.5rem;">Please use the OTP below:</p>
                <div style="background: #fef3c7; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; border: 2px solid #f59e0b;">
                    <div style="font-size: 2rem; font-weight: bold; color: #d97706; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${result.debugOtp}
                    </div>
                </div>
                <p style="color: #6b7280; font-size: 0.9rem;">
                    <i class="fas fa-terminal"></i> Also check server console for OTP
                </p>
            </div>
        `;
    } else {
        successMessage.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-envelope" style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3 style="color: #059669; margin-bottom: 1rem;">Verification Code Sent!</h3>
                <p style="color: #6b7280; margin-bottom: 1.5rem;">We've sent a 6-digit verification code to your email address.</p>
                <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; border: 2px solid #10b981;">
                    <strong style="color: #059669;">Email:</strong> ${email}<br>
                    <strong style="color: #059669;">Provider:</strong> SendGrid<br>
                    <strong style="color: #059669;">Valid for:</strong> 10 minutes
                </div>
                <p style="color: #6b7280; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Check your inbox and spam folder
                </p>
            </div>
        `;
    }
    
    // Store contact info for verification
    currentContact = email;
    currentMethod = 'email';
    
    // Start OTP timer
    startOTPTimer(result.expiresIn || 600);
    
    if (isResend) {
        showNotification(`✅ Verification code resent successfully!`, 'success');
    } else {
        if (result.provider === 'manual') {
            showNotification(`⚠️ Use the OTP shown above`, 'warning');
        } else {
            showNotification(`✅ Verification code sent to your email!`, 'success');
        }
    }
}

// Show verify OTP modal
function showVerifyOTPModal() {
    console.log('🔢 Opening verify OTP modal...');
    closeAllModals();
    const verifyOTPModal = document.getElementById('verifyOTPModal');
    if (verifyOTPModal) {
        verifyOTPModal.style.display = 'block';
        
        // Update contact info
        const contactElement = document.getElementById('verifyContactDisplay');
        if (contactElement && currentContact) {
            contactElement.innerHTML = `<i class="fas fa-envelope"></i> ${currentContact}`;
        }
        
        // Reset form and focus on OTP field
        document.getElementById('verifyOTPForm').reset();
        setTimeout(() => {
            document.getElementById('enterOTP').focus();
        }, 100);
    }
}

// Handle verify OTP and reset password
async function handleVerifyOTP(e) {
    e.preventDefault();
    console.log('🔄 Verify OTP form submitted');
    
    const email = currentContact;
    const otp = document.getElementById('enterOTP').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validation
    if (!email || !otp || !newPassword || !confirmNewPassword) {
        showNotification('Please fill all fields', 'error');
        return;
    }
    
    if (otp.length !== 6) {
        showNotification('Please enter a valid 6-digit OTP', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        showLoading('verifyOTPModal', 'Verifying OTP and resetting password...');
        
        const requestBody = { 
            email: email, 
            otp: otp, 
            newPassword: newPassword 
        };

        const response = await fetch(`${API_BASE}/auth/verify-otp-reset-password`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();
        console.log('📊 Verify OTP response:', result);

        if (result.success) {
            showNotification(`✅ Password reset successfully for ${email}! You can now login with your new password.`, 'success');
            resetOTPTimer();
            closeModal('verifyOTPModal');
            // Redirect to login
            setTimeout(() => {
                showLogin();
            }, 2000);
        } else {
            throw new Error(result.message || 'Failed to reset password');
        }
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        showNotification(error.message || 'Failed to reset password. Please try again.', 'error');
        
        const verifyOTPModal = document.getElementById('verifyOTPModal');
        if (verifyOTPModal) {
            verifyOTPModal.querySelector('.loading')?.remove();
        }
    }
}

// Start OTP countdown timer (1 minute)
function startOTPTimer(duration) {
    const timerElement = document.getElementById('otpTimer');
    if (!timerElement) return;
    
    otpTimeLeft = duration;
    updateTimerDisplay();
    
    otpTimer = setInterval(() => {
        otpTimeLeft--;
        updateTimerDisplay();
        
        if (otpTimeLeft <= 0) {
            clearInterval(otpTimer);
            timerElement.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i> OTP Expired</span>';
            document.getElementById('resendOTP').style.display = 'block';
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    const timerElement = document.getElementById('otpTimer');
    if (!timerElement) return;
    
    const minutes = Math.floor(otpTimeLeft / 60);
    const seconds = otpTimeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Reset OTP timer
function resetOTPTimer() {
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }
    otpTimeLeft = 0;
    const timerElement = document.getElementById('otpTimer');
    if (timerElement) {
        timerElement.textContent = '10:00';
    }
    document.getElementById('resendOTP').style.display = 'none';
}


// Resend OTP
function resendOTP() {
    if (otpTimeLeft > 0) {
        showNotification('Please wait for the timer to expire before resending', 'warning');
        return;
    }
    
    handleSendOTP(new Event('submit'), true);
}

// Reset loading state
function resetLoading(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.querySelector('.loading')?.remove();
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
                url: 'images/thar.jpg', 
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
                url: 'images/fortuner.avif', 
                alt: 'Toyota Fortuner' 
            }],
            available: true,
            color: 'White',
            mileage: '12 kmpl'
        },
        {
            _id: '3',
            make: 'Hyundai',
            model: 'Creta',
            year: 2024,
            type: 'SUV',
            pricePerDay: 2800,
            pricePerHour: 350,
            fuelType: 'Petrol',
            transmission: 'Automatic',
            seats: 5,
            features: ['Sunroof', 'AC', 'Touchscreen', 'Rear Camera'],
            images: [{ 
                url: 'images/creta.avif', 
                alt: 'Hyundai Creta' 
            }],
            available: true,
            color: 'White',
            mileage: '17 kmpl'
        }
    ];
    
    console.log(`✅ Loaded ${cars.length} sample cars with local images`);
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
                     onerror="handleImageError(this, '${car.make.toLowerCase()}', '${car.model.toLowerCase()}')">
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

// Handle image loading errors with better fallback
function handleImageError(imgElement, make, model) {
    console.log(`🔄 Image failed to load for ${make} ${model}, trying fallback...`);
    
    const fallbackImages = {
        'mahindra': {
            'thar': 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        },
        'toyota': {
            'fortuner': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        },
        'hyundai': {
            'creta': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        }
    };
    
    // Try specific model fallback first, then brand fallback
    let fallbackUrl = 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    
    if (fallbackImages[make] && fallbackImages[make][model]) {
        fallbackUrl = fallbackImages[make][model];
    } else {
        // Generic fallback based on car type
        const genericFallbacks = {
            'suv': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'sedan': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
            'hatchback': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
        };
        
        const carType = document.querySelector(`[data-brand="${make}"]`)?.getAttribute('data-type')?.toLowerCase();
        if (carType && genericFallbacks[carType]) {
            fallbackUrl = genericFallbacks[carType];
        }
    }
    
    imgElement.onerror = null; // Prevent infinite loop
    imgElement.src = fallbackUrl;
}

// Helper function to get car image
function getCarImage(car) {
    // First, check if car has specific image in database
    if (car.images && car.images[0] && car.images[0].url) {
        return car.images[0].url;
    }
    
    // Use local images for specific car models
    const localImages = {
        'mahindra': {
            'thar': 'images/thar.jpg'
        },
        'toyota': {
            'fortuner': 'images/fortuner.avif'
        },
        'hyundai': {
            'creta': 'images/creta.avif'
        }
    };
    
    const make = car.make.toLowerCase();
    const model = car.model.toLowerCase();
    
    // Check if we have a local image for this specific car
    if (localImages[make] && localImages[make][model]) {
        return localImages[make][model];
    }
    
    // Fallback to default online images
    const defaultImages = {
        'mahindra': 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'toyota': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'maruti': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'hyundai': 'https://images.unsplash.com/photo-1621135802920-133df287f89c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    };
    
    return defaultImages[make] || 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
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
    e.preventDefault();
    console.log('📝 Registration form submitted');
    
    const userData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value
    };

    console.log('👤 Registration data:', userData);

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
            
            initializeSessionManagement();
            closeModal('registerModal');
            updateUI();
            await loadUserBookings();
            showTemporaryNotification('🎉 Registration successful! Welcome, ' + currentUser.name, 'success');
        } else {
            throw new Error(result.message || 'Registration failed');
        }
    } catch (error) {
        console.error('❌ Registration error:', error);
        showNotification(error.message || 'Registration failed. Please try again.', 'error');
        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            registerModal.querySelector('.loading')?.remove();
        }
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
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
            
            initializeSessionManagement();
            closeModal('loginModal');
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
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.querySelector('.loading')?.remove();
        }
    }
}

// Handle booking
async function handleBooking(e) {
    e.preventDefault();
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
    
    if (!container) {
        console.error('❌ bookingsContainer element not found!');
        return;
    }
    
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

// Update UI based on auth status
function updateUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const navLinks = document.querySelector('.nav-links');
    const mobileAuthButtons = document.querySelector('.mobile-auth-buttons');
    
    console.log('🔄 Updating UI, currentUser:', currentUser);
    
    const existingUserDisplay = document.querySelector('.user-display');
    if (existingUserDisplay) {
        existingUserDisplay.remove();
    }

    const existingAdminLink = document.querySelector('.admin-nav-link');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }

    if (currentUser) {
        console.log('👤 User logged in:', currentUser.name);
        
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
        
        if (authButtons) {
            authButtons.innerHTML = '';
            authButtons.appendChild(userDisplay);
        }
        
        if (mobileAuthButtons) {
            mobileAuthButtons.innerHTML = `
                <div style="text-align: center; color: var(--green); margin-bottom: 1rem;">
                    <i class="fas fa-user"></i> Welcome, ${currentUser.name}
                </div>
                <button class="btn btn-secondary btn-full" onclick="logout(); closeMobileMenu();">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
        }
        
        if (currentUser.role === 'admin' && navLinks) {
            console.log('👑 Admin user detected, adding dashboard link to nav');
            
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
            
            const bookingsLink = Array.from(navLinks.children).find(child => 
                child.textContent.includes('My Bookings')
            );
            
            if (bookingsLink) {
                bookingsLink.replaceWith(adminLink);
                console.log('✅ Replaced "My Bookings" with "Admin Dashboard" for admin');
            } else {
                navLinks.insertBefore(adminLink, authButtons);
                console.log('✅ Added "Admin Dashboard" to navigation');
            }
        }
        
    } else {
        console.log('👤 No user logged in');
        
        if (authButtons) {
            authButtons.innerHTML = `
                <button class="btn btn-primary" id="loginBtn">Login</button>
                <button class="btn btn-secondary" id="registerBtn">Register</button>
            `;
            
            // Re-attach event listeners to new buttons
            setTimeout(() => {
                const newLoginBtn = document.getElementById('loginBtn');
                const newRegisterBtn = document.getElementById('registerBtn');
                
                if (newLoginBtn) newLoginBtn.addEventListener('click', showLogin);
                if (newRegisterBtn) newRegisterBtn.addEventListener('click', showRegister);
            }, 100);
        }
        
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
        
        // Ensure "My Bookings" link exists for non-admin users
        if (navLinks) {
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
                
                bookingsLink.addEventListener('mouseenter', function() {
                    this.style.color = 'var(--green)';
                });
                
                bookingsLink.addEventListener('mouseleave', function() {
                    this.style.color = 'var(--lightest-slate)';
                });
                
                navLinks.insertBefore(bookingsLink, authButtons);
            }
        }
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
    console.log('👋 Logging out user:', currentUser?.name);
    
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

// Show temporary notification message
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

// Add CSS animation
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

// Session management
function initializeSessionManagement() {
    console.log('🔐 Initializing session management...');
    
    if (currentUser) {
        sessionStorage.setItem('naiduCarRentalsActiveSession', 'true');
        console.log('✅ Session tracking enabled');
    }
    
    window.addEventListener('load', function() {
        const activeSession = sessionStorage.getItem('naiduCarRentalsActiveSession');
        if (!activeSession && (localStorage.getItem('token') || localStorage.getItem('user'))) {
            console.log('🚫 Session expired - auto logging out');
            logout();
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

// Scroll to cars section
function scrollToCars() {
    document.getElementById('cars').scrollIntoView({ behavior: 'smooth' });
}

console.log('✅ Naidu Car Rentals Frontend loaded successfully!');