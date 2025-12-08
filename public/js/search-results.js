// Enhanced Search Results with Fixed Images and Better Validation

// Configuration
const VALID_CARS = [
    'toyota fortuner', 'maruti suzuki dzire', 'hyundai creta', 
    'mahindra thar', 'tata nexon', 'kia seltos', 'honda city',
    'maruti swift', 'hyundai venue', 'toyota innova',
    'mahindra scorpio', 'tata harrier', 'mg hector',
    'renault kwid', 'maruti baleno', 'hyundai i20',
    'toyota glanza', 'honda amaze', 'kia sonet',
    'volkswagen virtus', 'skoda slavia', 'mg astor'
];

// Image URLs by car model
const CAR_IMAGES = {
    'toyota fortuner': [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=60',
        'https://images.unsplash.com/photo-1620137466706-48c7c6d6b4a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    'maruti suzuki dzire': [
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b6c711c04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    'hyundai creta': [
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    'mahindra thar': [
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ],
    'default': [
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b6c711c04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
};

// Global variables
let currentSearchTerm = '';
let currentCarInfo = null;
let images = [];
let currentImageIndex = 0;
let isRefreshing = false;
let voiceRecognition = null;
let isValidCar = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get search term from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSearchTerm = urlParams.get('q') || '';
    
    if (!currentSearchTerm) {
        window.location.href = 'index.html';
        return;
    }
    
    initializePage();
});

async function initializePage() {
    // Update UI
    document.getElementById('searchTerm').textContent = currentSearchTerm;
    document.getElementById('searchQuery').value = currentSearchTerm;
    
    // Validate search term
    isValidCar = validateCarSearch(currentSearchTerm);
    
    if (!isValidCar) {
        showNoCarFound();
        return;
    }
    
    // Show loading states
    showLoading();
    
    // Fetch car information and images
    try {
        await fetchCarInformation();
        await fetchCarImages();
        showSimilarCars();
    } catch (error) {
        console.error('Error initializing page:', error);
        showError('Failed to load car information. Please try again.');
    }
    
    // Setup event listeners
    setupEventListeners();
    setupVoiceRecognition();
}

// Validate if search term is a valid car
function validateCarSearch(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    // Check if it contains car-related keywords
    const carKeywords = ['car', 'vehicle', 'auto', 'automobile', 'sedan', 'suv', 'hatchback', 'jeep'];
    const hasCarKeyword = carKeywords.some(keyword => term.includes(keyword));
    
    // Check against valid car list
    const isInValidList = VALID_CARS.some(car => term.includes(car) || car.includes(term));
    
    // Check for manufacturer names
    const manufacturers = ['toyota', 'maruti', 'hyundai', 'mahindra', 'tata', 'honda', 'kia', 'mg', 'skoda', 'volkswagen'];
    const hasManufacturer = manufacturers.some(manufacturer => term.includes(manufacturer));
    
    return isInValidList || (hasManufacturer && term.length > 3) || hasCarKeyword;
}

// Update the getCarImageURLs function in search-results.js

async function getCarImageURLs(carName) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const term = carName.toLowerCase();
    
    // For real Google Images search (this is a simulation - in production, you'd use Google Custom Search API)
    const googleSearchTerm = encodeURIComponent(carName + ' car 2024 exterior interior');
    
    // Simulated response from Google Images API
    // Note: In production, you would make actual API calls to:
    // 1. Google Custom Search JSON API
    // 2. Unsplash API
    // 3. Pexels API
    // 4. Car manufacturer websites
    
    if (term.includes('fortuner')) {
        return [
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/210303/fortuner-legender-exterior-right-front-three-quarter-3.jpeg?isig=0&wm=1&q=80',
                title: 'Toyota Fortuner 2024 - Front View',
                type: 'Exterior',
                source: 'Toyota Official'
            },
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/210303/fortuner-legender-exterior-right-side-view-2.jpeg?isig=0&wm=1&q=80',
                title: 'Toyota Fortuner 2024 - Side View',
                type: 'Exterior',
                source: 'Toyota Official'
            },
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/210303/fortuner-legender-exterior-right-rear-three-quarter-4.jpeg?isig=0&wm=1&q=80',
                title: 'Toyota Fortuner 2024 - Rear View',
                type: 'Exterior',
                source: 'Toyota Official'
            },
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/210303/fortuner-legender-interior-dashboard-2.jpeg?isig=0&wm=1&q=80',
                title: 'Toyota Fortuner 2024 - Dashboard',
                type: 'Interior',
                source: 'Toyota Official'
            },
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/210303/fortuner-legender-interior-seats-2.jpeg?isig=0&wm=1&q=80',
                title: 'Toyota Fortuner 2024 - Seats',
                type: 'Interior',
                source: 'Toyota Official'
            }
        ];
    } else if (term.includes('dzire')) {
        return [
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/141029/dzire-exterior-right-front-three-quarter-2.jpeg?isig=0&wm=1&q=80',
                title: 'Maruti Suzuki Dzire 2024 - Front View',
                type: 'Exterior',
                source: 'Maruti Official'
            },
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/141029/dzire-exterior-right-side-view-3.jpeg?isig=0&wm=1&q=80',
                title: 'Maruti Suzuki Dzire 2024 - Side View',
                type: 'Exterior',
                source: 'Maruti Official'
            },
            {
                url: 'https://imgd.aeplcdn.com/642x336/n/cw/ec/141029/dzire-interior-dashboard-2.jpeg?isig=0&wm=1&q=80',
                title: 'Maruti Suzuki Dzire 2024 - Dashboard',
                type: 'Interior',
                source: 'Maruti Official'
            }
        ];
    } else {
        // Generic car images from car manufacturer websites
        return [
            {
                url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                title: `${carName} - Exterior View`,
                type: 'Exterior',
                source: 'Car Images'
            },
            {
                url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                title: `${carName} - Side View`,
                type: 'Exterior',
                source: 'Car Images'
            },
            {
                url: 'https://images.unsplash.com/photo-1552519507-da3b6c711c04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
                title: `${carName} - Interior`,
                type: 'Interior',
                source: 'Car Images'
            }
        ];
    }
}

// Enhanced information display
async function fetchCarInformation() {
    try {
        const infoLoading = document.getElementById('infoLoading');
        infoLoading.innerHTML = `
            <div class="spinner">
                <i class="fas fa-brain fa-spin"></i>
            </div>
            <div class="loading-text">
                <h4 class="darker-text">Fetching Real-time Information</h4>
                <p class="dark-text">Getting latest details about ${currentSearchTerm}...</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // Get car info
        const carInfo = await getCarInformation(currentSearchTerm);
        currentCarInfo = carInfo;
        
        // Display the information
        displayCarInformation(carInfo);
        
        // Hide loading
        document.getElementById('infoLoading').style.display = 'none';
        document.getElementById('informationContent').style.display = 'block';
        
        // Update results count
        document.getElementById('resultsCount').innerHTML = `
            <i class="fas fa-check-circle" style="color: #27ae60; margin-right: 5px;"></i>
            Information loaded: ${new Date().toLocaleTimeString()}
        `;
        
        showToast('Car information loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error fetching car information:', error);
        document.getElementById('infoLoading').style.display = 'none';
        document.getElementById('infoError').style.display = 'block';
    }
}

// Get car information
async function getCarInformation(carName) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const term = carName.toLowerCase();
    
    if (term.includes('fortuner')) {
        return {
            carName: "Toyota Fortuner",
            company: "Toyota",
            tagline: "The Legendary SUV with Superior Performance and Luxury Features",
            year: "2024",
            price: {
                exShowroom: "₹33.43 Lakh",
                onRoad: "₹38.50 - ₹42.80 Lakh",
                variants: [
                    { name: "4x2 MT", price: "₹33.43 Lakh" },
                    { name: "Legender 4x2 AT", price: "₹44.33 Lakh" },
                    { name: "4x4 AT", price: "₹51.44 Lakh" }
                ]
            },
            specifications: {
                engine: "2755cc Diesel, 201 BHP @ 3400 RPM",
                transmission: "6-Speed Automatic / 6-Speed Manual",
                fuelType: "Diesel",
                mileage: "10-12 km/l",
                seatingCapacity: "7 Persons",
                airbags: "7 Airbags (Driver, Passenger, Side, Curtain, Knee)",
                length: "4795 mm",
                width: "1855 mm",
                height: "1835 mm",
                wheelbase: "2745 mm",
                bootSpace: "296 Liters",
                groundClearance: "225 mm",
                fuelTank: "80 Liters"
            },
            keyFeatures: [
                "4WD Capability",
                "Toyota Safety Sense",
                "9-inch Touchscreen Infotainment",
                "Panoramic Sunroof",
                "Ventilated Front Seats",
                "360-degree Camera",
                "Wireless Charging",
                "Apple CarPlay & Android Auto",
                "Ambient Lighting",
                "Power Tailgate"
            ],
            safetyFeatures: [
                "7 Airbags",
                "ABS with EBD",
                "Vehicle Stability Control",
                "Hill Start Assist",
                "Downhill Assist Control",
                "Traction Control",
                "Rear Parking Sensors",
                "360-degree Camera",
                "Tyre Pressure Monitoring"
            ],
            colors: ["White Pearl", "Attitude Black", "Silver Metallic", "Gray Metallic", "Red Mica"],
            pros: [
                "Excellent off-road capability",
                "Powerful diesel engine",
                "Spacious 7-seater",
                "Toyota reliability",
                "High resale value",
                "Premium interior quality"
            ],
            cons: [
                "Low fuel efficiency",
                "Expensive maintenance",
                "Heavy steering in city",
                "Third row is cramped for adults"
            ],
            expertReview: "The Toyota Fortuner continues to dominate the premium SUV segment with its rugged capability, premium features, and Toyota's legendary reliability. The 2024 model gets updated styling, enhanced safety features, and improved interior comfort. It's perfect for both city drives and off-road adventures.",
            rating: 4.5,
            competitors: ["Ford Endeavour", "MG Gloster", "Mahindra Alturas G4"],
            rentalInfo: {
                hourly: "₹800 - ₹1,200/hour",
                daily: "₹8,000 - ₹12,000/day",
                weekly: "₹45,000 - ₹65,000/week"
            }
        };
    } else if (term.includes('dzire') || (term.includes('maruti') && term.includes('sedan'))) {
        return {
            carName: "Maruti Suzuki Dzire",
            company: "Maruti Suzuki",
            tagline: "India's Best-Selling Compact Sedan with Exceptional Fuel Efficiency",
            year: "2024",
            price: {
                exShowroom: "₹6.51 Lakh",
                onRoad: "₹7.20 - ₹9.90 Lakh",
                variants: [
                    { name: "LXI", price: "₹6.51 Lakh" },
                    { name: "VXI", price: "₹7.84 Lakh" },
                    { name: "ZXI", price: "₹9.39 Lakh" },
                    { name: "ZXI Plus", price: "₹9.84 Lakh" }
                ]
            },
            specifications: {
                engine: "1197cc Petrol, 89 BHP @ 6000 RPM",
                transmission: "5-Speed Manual / 5-Speed AMT",
                fuelType: "Petrol / CNG",
                mileage: "24.12 km/l (Petrol), 31.12 km/kg (CNG)",
                seatingCapacity: "5 Persons",
                airbags: "Dual Front Airbags",
                length: "3995 mm",
                width: "1735 mm",
                height: "1515 mm",
                wheelbase: "2450 mm",
                bootSpace: "378 Liters",
                groundClearance: "163 mm",
                fuelTank: "37 Liters"
            },
            keyFeatures: [
                "Smart Hybrid Technology",
                "7-inch SmartPlay Pro+ Touchscreen",
                "Apple CarPlay & Android Auto",
                "Auto Climate Control",
                "Push Button Start",
                "Rear AC Vents",
                "LED Projector Headlamps",
                "Auto-dimming IRVM",
                "Rear Parking Camera"
            ],
            safetyFeatures: [
                "Dual Front Airbags",
                "ABS with EBD",
                "Rear Parking Sensors",
                "Speed Alert System",
                "Seat Belt Reminder",
                "High-Speed Alert"
            ],
            colors: ["Pearl Arctic White", "Magma Grey", "Premium Silver", "Nexa Blue"],
            pros: [
                "Excellent fuel efficiency",
                "Low maintenance cost",
                "Spacious boot space",
                "Smooth AMT transmission",
                "Great resale value",
                "Extensive service network"
            ],
            cons: [
                "Average highway performance",
                "Basic interior quality",
                "Limited rear headroom"
            ],
            expertReview: "The Maruti Suzuki Dzire continues to be India's favorite compact sedan, offering unbeatable fuel efficiency, low running costs, and Maruti's vast service network. The 2024 model gets subtle updates and maintains its position as the best value-for-money sedan in its segment.",
            rating: 4.3,
            competitors: ["Honda Amaze", "Hyundai Aura", "Tata Tigor"],
            rentalInfo: {
                hourly: "₹150 - ₹250/hour",
                daily: "₹1,800 - ₹2,500/day",
                weekly: "₹10,000 - ₹12,500/week"
            }
        };
    } else {
        // Generic car template for valid searches
        const carTypes = ['SUV', 'Sedan', 'Hatchback', 'MPV'];
        const randomType = carTypes[Math.floor(Math.random() * carTypes.length)];
        
        return {
            carName: carName.charAt(0).toUpperCase() + carName.slice(1),
            company: getManufacturerFromTerm(term),
            tagline: `Premium ${randomType} with excellent performance and modern features`,
            year: "2024",
            price: {
                exShowroom: "₹8.00 - ₹25.00 Lakh",
                onRoad: "₹9.50 - ₹30.00 Lakh",
                variants: [
                    { name: "Base", price: "₹8.00 Lakh" },
                    { name: "Mid", price: "₹15.00 Lakh" },
                    { name: "Top", price: "₹25.00 Lakh" }
                ]
            },
            specifications: {
                engine: "1500-2000cc, 100-150 BHP",
                transmission: "Manual/Automatic",
                fuelType: "Petrol/Diesel",
                mileage: "15-20 km/l",
                seatingCapacity: "5 Persons",
                airbags: "2-6 Airbags",
                length: "4000-4500 mm",
                width: "1700-1800 mm",
                height: "1500-1600 mm",
                wheelbase: "2500-2600 mm",
                bootSpace: "350-400 Liters",
                groundClearance: "170-180 mm",
                fuelTank: "40-50 Liters"
            },
            keyFeatures: [
                "Touchscreen Infotainment",
                "Air Conditioning",
                "Power Windows",
                "Central Locking",
                "Safety Features",
                "Comfortable Seating",
                "Good Boot Space"
            ],
            safetyFeatures: [
                "Airbags",
                "ABS with EBD",
                "Rear Parking Sensors",
                "Seat Belts with Pretensioners",
                "Speed Alert System"
            ],
            colors: ["White", "Black", "Silver", "Red", "Blue"],
            pros: [
                "Good performance",
                "Decent features",
                "Reliable brand",
                "Good resale value",
                "Comfortable ride"
            ],
            cons: [
                "Could be expensive",
                "Maintenance costs",
                "Average fuel efficiency"
            ],
            expertReview: `This ${randomType.toLowerCase()} offers good value for money with decent performance and features suitable for daily commuting and occasional long drives. It provides a comfortable driving experience with modern amenities.`,
            rating: 4.0,
            competitors: ["Similar segment vehicles"],
            rentalInfo: {
                hourly: "₹200 - ₹500/hour",
                daily: "₹2,000 - ₹5,000/day",
                weekly: "₹12,000 - ₹30,000/week"
            }
        };
    }
}

// Get manufacturer from search term
function getManufacturerFromTerm(term) {
    if (term.includes('toyota')) return 'Toyota';
    if (term.includes('maruti')) return 'Maruti Suzuki';
    if (term.includes('hyundai')) return 'Hyundai';
    if (term.includes('mahindra')) return 'Mahindra';
    if (term.includes('tata')) return 'Tata Motors';
    if (term.includes('honda')) return 'Honda';
    if (term.includes('kia')) return 'Kia';
    if (term.includes('mg')) return 'MG Motors';
    return 'Multiple Manufacturers';
}

// Display car information
function displayCarInformation(carInfo) {
    const container = document.getElementById('informationContent');
    
    container.innerHTML = `
        <div class="car-header">
            <h1 class="car-name darker-text">${carInfo.carName}</h1>
            <div class="car-company">
                <i class="fas fa-industry"></i>
                <span class="dark-text">Manufactured by ${carInfo.company} • ${carInfo.year} Model</span>
            </div>
            <p class="car-tagline darker-text">${carInfo.tagline}</p>
            <div class="car-highlights">
                <div class="highlight-item">
                    <i class="fas fa-rupee-sign"></i>
                    <span class="darker-text">On-road: ${carInfo.price.onRoad}</span>
                </div>
                <div class="highlight-item">
                    <i class="fas fa-gas-pump"></i>
                    <span class="darker-text">Mileage: ${carInfo.specifications.mileage}</span>
                </div>
                <div class="highlight-item">
                    <i class="fas fa-users"></i>
                    <span class="darker-text">Seats: ${carInfo.specifications.seatingCapacity}</span>
                </div>
                <div class="highlight-item">
                    <i class="fas fa-shield-alt"></i>
                    <span class="darker-text">Airbags: ${carInfo.specifications.airbags}</span>
                </div>
                <div class="highlight-item">
                    <i class="fas fa-star"></i>
                    <span class="darker-text">Rating: ${carInfo.rating}/5</span>
                </div>
            </div>
        </div>
        
        <div class="quick-facts-grid">
            <div class="fact-card">
                <div class="fact-icon">
                    <i class="fas fa-engine"></i>
                </div>
                <div class="fact-value darker-text">${carInfo.specifications.engine.split(',')[0]}</div>
                <div class="fact-label dark-text">Engine</div>
                <div class="fact-subtext">${carInfo.specifications.engine.split(',').slice(1).join(',').trim()}</div>
            </div>
            
            <div class="fact-card">
                <div class="fact-icon">
                    <i class="fas fa-tachometer-alt"></i>
                </div>
                <div class="fact-value darker-text">${carInfo.specifications.mileage}</div>
                <div class="fact-label dark-text">Mileage</div>
                <div class="fact-subtext">${carInfo.specifications.fuelType}</div>
            </div>
            
            <div class="fact-card">
                <div class="fact-icon">
                    <i class="fas fa-chair"></i>
                </div>
                <div class="fact-value darker-text">${carInfo.specifications.seatingCapacity}</div>
                <div class="fact-label dark-text">Seating</div>
                <div class="fact-subtext">${carInfo.specifications.seatingCapacity.includes('7') ? '7-Seater' : '5-Seater'}</div>
            </div>
            
            <div class="fact-card">
                <div class="fact-icon">
                    <i class="fas fa-air-freshener"></i>
                </div>
                <div class="fact-value darker-text">${carInfo.specifications.airbags.split(' ')[0]}</div>
                <div class="fact-label dark-text">Airbags</div>
                <div class="fact-subtext">${carInfo.specifications.airbags.includes('Dual') ? 'Dual Front' : 'Multiple'}</div>
            </div>
            
            <div class="fact-card">
                <div class="fact-icon">
                    <i class="fas fa-suitcase-rolling"></i>
                </div>
                <div class="fact-value darker-text">${carInfo.specifications.bootSpace}</div>
                <div class="fact-label dark-text">Boot Space</div>
                <div class="fact-subtext">Liters</div>
            </div>
            
            <div class="fact-card">
                <div class="fact-icon">
                    <i class="fas fa-road"></i>
                </div>
                <div class="fact-value darker-text">${carInfo.specifications.groundClearance}</div>
                <div class="fact-label dark-text">Ground Clearance</div>
                <div class="fact-subtext">mm</div>
            </div>
        </div>
        
        <div class="info-tabs">
            <div class="tab-buttons">
                <button class="tab-btn active" data-tab="overview">
                    <i class="fas fa-eye"></i> Overview
                </button>
                <button class="tab-btn" data-tab="specifications">
                    <i class="fas fa-cogs"></i> Specifications
                </button>
                <button class="tab-btn" data-tab="features">
                    <i class="fas fa-star"></i> Features
                </button>
                <button class="tab-btn" data-tab="pricing">
                    <i class="fas fa-rupee-sign"></i> Pricing
                </button>
                <button class="tab-btn" data-tab="safety">
                    <i class="fas fa-shield-alt"></i> Safety
                </button>
            </div>
            
            <div class="tab-content active" id="overviewTab">
                <div class="overview-content">
                    <h3 class="darker-text">About ${carInfo.carName}</h3>
                    <p class="dark-text">${carInfo.expertReview}</p>
                    
                    <div class="overview-grid">
                        <div class="overview-item">
                            <h4 class="darker-text"><i class="fas fa-thumbs-up"></i> Pros</h4>
                            <ul class="dark-text">
                                ${carInfo.pros.map(pro => `<li>${pro}</li>`).join('')}
                            </ul>
                        </div>
                        
                        <div class="overview-item">
                            <h4 class="darker-text"><i class="fas fa-thumbs-down"></i> Cons</h4>
                            <ul class="dark-text">
                                ${carInfo.cons.map(con => `<li>${con}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="specificationsTab">
                <div class="specs-content">
                    <h3 class="darker-text">Technical Specifications</h3>
                    <table class="specs-table">
                        <thead>
                            <tr>
                                <th class="darker-text">Specification</th>
                                <th class="darker-text">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(carInfo.specifications).map(([key, value]) => `
                                <tr>
                                    <td class="dark-text"><strong>${formatSpecName(key)}</strong></td>
                                    <td class="dark-text">${value}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="tab-content" id="featuresTab">
                <div class="features-content">
                    <h3 class="darker-text">Key Features</h3>
                    <div class="features-grid">
                        ${carInfo.keyFeatures.map(feature => `
                            <div class="feature-item">
                                <i class="fas fa-check-circle"></i>
                                <span class="dark-text">${feature}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <h3 class="darker-text" style="margin-top: 30px;">Available Colors</h3>
                    <div class="color-grid">
                        ${carInfo.colors.map(color => `
                            <div class="color-item">
                                <div class="color-sample" style="background: ${getColorHex(color)}"></div>
                                <span class="dark-text">${color}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="pricingTab">
                <div class="pricing-content">
                    <h3 class="darker-text">Price Details</h3>
                    <div class="pricing-card">
                        <div class="price-row">
                            <span class="price-label darker-text">Ex-showroom Price</span>
                            <span class="price-value">${carInfo.price.exShowroom}</span>
                        </div>
                        
                        <div class="price-row">
                            <span class="price-label darker-text">On-road Price (Approx.)</span>
                            <span class="price-value">${carInfo.price.onRoad}</span>
                        </div>
                        
                        <div class="price-divider"></div>
                        
                        <h4 class="darker-text">Variant-wise Pricing</h4>
                        ${carInfo.price.variants.map(variant => `
                            <div class="price-row">
                                <span class="price-label dark-text">${variant.name}</span>
                                <span class="price-value">${variant.price}</span>
                            </div>
                        `).join('')}
                        
                        <div class="price-note dark-text">
                            <i class="fas fa-info-circle"></i>
                            Prices may vary based on location, offers, and insurance
                        </div>
                    </div>
                    
                    <div class="rental-pricing" style="margin-top: 30px;">
                        <h4 class="darker-text">Rental Prices (Approx.)</h4>
                        <div class="price-row">
                            <span class="price-label dark-text">Per Hour</span>
                            <span class="price-value">${carInfo.rentalInfo.hourly}</span>
                        </div>
                        <div class="price-row">
                            <span class="price-label dark-text">Per Day</span>
                            <span class="price-value">${carInfo.rentalInfo.daily}</span>
                        </div>
                        <div class="price-row">
                            <span class="price-label dark-text">Per Week</span>
                            <span class="price-value">${carInfo.rentalInfo.weekly}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="safetyTab">
                <div class="safety-content">
                    <h3 class="darker-text">Safety Features & Ratings</h3>
                    <div class="safety-rating">
                        <div class="rating-badge">
                            <div class="rating-score">${carInfo.rating}/5</div>
                            <div class="rating-label dark-text">Overall Safety Rating</div>
                        </div>
                    </div>
                    
                    <div class="safety-features">
                        <h4 class="darker-text">Safety Equipment</h4>
                        <div class="features-grid">
                            ${carInfo.safetyFeatures.map(feature => `
                                <div class="feature-item">
                                    <i class="fas fa-check"></i>
                                    <span class="dark-text">${feature}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="safety-info enhanced-contrast">
                        <h4 class="darker-text">Safety Information</h4>
                        <p class="dark-text">The ${carInfo.carName} comes equipped with ${carInfo.specifications.airbags.toLowerCase()} as standard, along with other advanced safety features to ensure maximum protection for all occupants.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup tab switching
    setupTabs();
}

// Format specification names
function formatSpecName(key) {
    return key
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Get color hex code
function getColorHex(colorName) {
    const colorMap = {
        'white': '#ffffff',
        'black': '#000000',
        'silver': '#c0c0c0',
        'red': '#ff0000',
        'blue': '#0000ff',
        'gray': '#808080',
        'green': '#008000',
        'yellow': '#ffff00',
        'brown': '#a52a2a',
        'orange': '#ffa500',
        'purple': '#800080'
    };
    
    const lowerColor = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
        if (lowerColor.includes(key)) {
            return value;
        }
    }
    
    return '#cccccc';
}

// Setup tabs
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
}

// Fetch car images
async function fetchCarImages() {
    try {
        const imagesLoading = document.getElementById('imagesLoading');
        imagesLoading.innerHTML = `
            <div class="spinner">
                <i class="fas fa-image fa-spin"></i>
            </div>
            <div class="loading-text">
                <h4 class="darker-text">Searching for HD Images</h4>
                <p class="dark-text">Fetching high-quality images of ${currentSearchTerm}...</p>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // Get image URLs
        images = await getCarImageURLs(currentSearchTerm);
        
        if (images.length > 0) {
            displayCarImages(images);
            document.getElementById('imagesLoading').style.display = 'none';
            document.getElementById('imageGallery').style.display = 'block';
            document.getElementById('totalImages').textContent = images.length;
            document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
        } else {
            throw new Error('No images found');
        }
        
    } catch (error) {
        console.error('Error fetching images:', error);
        document.getElementById('imagesLoading').style.display = 'none';
        document.getElementById('noImagesFound').style.display = 'block';
        document.getElementById('imageSearchTerm').textContent = currentSearchTerm;
    }
}



// Display car images with fallback
function displayCarImages(imageList) {
    images = imageList;
    currentImageIndex = 0;
    
    const galleryContainer = document.getElementById('imageGallery');
    
    galleryContainer.innerHTML = `
        <div class="gallery-container">
            <img id="mainImage" src="${images[0].url}" alt="${images[0].title}" 
                 onerror="handleImageError(this, '${images[0].title}')">
            <div class="image-controls">
                <button onclick="prevImage()" class="nav-btn prev-btn">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span id="imageCounter" class="dark-text">1 / ${images.length}</span>
                <button onclick="nextImage()" class="nav-btn next-btn">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
        
        <div class="thumbnail-grid" id="thumbnailGrid">
            ${images.map((image, index) => `
                <img src="${image.url}" alt="${image.title}" 
                     class="thumbnail ${index === 0 ? 'active' : ''}"
                     onclick="selectImage(${index})"
                     onerror="handleThumbnailError(this, ${index})">
            `).join('')}
        </div>
    `;
}

// Handle image loading errors
function handleImageError(img, title) {
    console.log('Image load error:', img.src);
    img.style.display = 'none';
    
    const container = img.parentElement;
    const fallback = document.createElement('div');
    fallback.className = 'fallback-image';
    fallback.innerHTML = `
        <div>
            <i class="fas fa-car"></i>
            <p class="dark-text">${title}</p>
            <small class="dark-text">Image not available</small>
        </div>
    `;
    
    container.appendChild(fallback);
}

function handleThumbnailError(img, index) {
    console.log('Thumbnail load error:', img.src);
    img.style.display = 'none';
    
    const fallback = document.createElement('div');
    fallback.className = 'thumbnail fallback';
    fallback.innerHTML = `<i class="fas fa-image"></i>`;
    fallback.onclick = () => selectImage(index);
    
    img.parentNode.replaceChild(fallback, img);
}

// Select image
function selectImage(index) {
    currentImageIndex = index;
    const mainImage = document.getElementById('mainImage');
    const imageCounter = document.getElementById('imageCounter');
    
    if (mainImage && images[index]) {
        mainImage.src = images[index].url;
        mainImage.alt = images[index].title;
        imageCounter.textContent = `${index + 1} / ${images.length}`;
        
        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
}

// Next image
function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    selectImage(currentImageIndex);
}

// Previous image
function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    selectImage(currentImageIndex);
}

// Show no car found message
function showNoCarFound() {
    document.getElementById('infoLoading').style.display = 'none';
    document.getElementById('imagesLoading').style.display = 'none';
    document.getElementById('noCarFound').style.display = 'block';
    document.getElementById('invalidSearchTerm').textContent = currentSearchTerm;
    
    // Add suggestions
    const suggestionsList = document.querySelector('.suggestions-list');
    const suggestions = getSearchSuggestions(currentSearchTerm);
    
    suggestionsList.innerHTML = suggestions.map(car => `
        <div class="suggestion-item" onclick="searchSuggestion('${car}')">
            ${car}
        </div>
    `).join('');
    
    // Show similar cars section
    showSimilarCars();
}

// Get search suggestions
function getSearchSuggestions(term) {
    const termLower = term.toLowerCase();
    const suggestions = [];
    
    VALID_CARS.forEach(car => {
        if (car.includes(termLower) || termLower.includes(car.split(' ')[0])) {
            suggestions.push(car.split(' ').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '));
        }
    });
    
    // If no direct matches, show popular cars
    if (suggestions.length === 0) {
        return [
            'Toyota Fortuner',
            'Maruti Suzuki Dzire',
            'Hyundai Creta',
            'Mahindra Thar',
            'Tata Nexon'
        ];
    }
    
    return suggestions.slice(0, 5);
}

// Search suggestion click
function searchSuggestion(carName) {
    currentSearchTerm = carName;
    document.getElementById('searchTerm').textContent = carName;
    document.getElementById('searchQuery').value = carName;
    resetAndSearch();
}

// Show similar cars
function showSimilarCars() {
    const similarCars = getSimilarCars(currentSearchTerm);
    
    if (similarCars.length > 0) {
        const similarCarsGrid = document.getElementById('similarCarsGrid');
        const similarCarsSection = document.getElementById('similarCarsSection');
        
        similarCarsGrid.innerHTML = similarCars.map(car => `
            <div class="similar-car-card" onclick="searchSuggestion('${car.name}')">
                <div class="similar-car-img">
                    <img src="${car.image}" alt="${car.name}" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80'">
                </div>
                <div class="similar-car-info">
                    <div class="similar-car-name darker-text">${car.name}</div>
                    <div class="similar-car-price">${car.price}</div>
                    <div class="similar-car-type dark-text">${car.type}</div>
                </div>
            </div>
        `).join('');
        
        similarCarsSection.style.display = 'block';
    }
}

// Get similar cars
function getSimilarCars(term) {
    const termLower = term.toLowerCase();
    const similar = [];
    
    // Find similar cars based on manufacturer or type
    VALID_CARS.forEach(car => {
        if (car !== termLower && 
            (car.includes(termLower.split(' ')[0]) || 
             termLower.includes(car.split(' ')[0]))) {
            similar.push({
                name: car.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                price: getRandomPrice(),
                type: getCarType(car),
                image: CAR_IMAGES[car] ? CAR_IMAGES[car][0] : CAR_IMAGES.default[0]
            });
        }
    });
    
    return similar.slice(0, 4);
}

function getRandomPrice() {
    const prices = ['₹8-12 L', '₹12-18 L', '₹18-25 L', '₹25-35 L', '₹35-50 L'];
    return prices[Math.floor(Math.random() * prices.length)];
}

function getCarType(carName) {
    if (carName.includes('fortuner') || carName.includes('thar') || carName.includes('creta')) return 'SUV';
    if (carName.includes('dzire') || carName.includes('city') || carName.includes('amaze')) return 'Sedan';
    if (carName.includes('swift') || carName.includes('baleno') || carName.includes('i20')) return 'Hatchback';
    return 'Car';
}

// Setup event listeners
function setupEventListeners() {
    // Search form submission
    document.getElementById('searchQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Image quality filter
    document.getElementById('imageQualityFilter').addEventListener('change', function() {
        showToast(`Image quality set to: ${this.value.toUpperCase()}`, 'info');
    });
    
    // Search button click
    document.querySelector('.search-btn').addEventListener('click', performSearch);
}

// Setup voice recognition
function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceRecognition = new SpeechRecognition();
        
        voiceRecognition.continuous = false;
        voiceRecognition.interimResults = false;
        voiceRecognition.lang = 'en-IN';
        
        const voiceBtn = document.getElementById('voiceSearchBtn');
        
        voiceBtn.addEventListener('click', function() {
            if (voiceRecognition) {
                voiceRecognition.start();
                voiceBtn.classList.add('listening');
                showToast('Listening... Say a car name', 'info');
            }
        });
        
        voiceRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            currentSearchTerm = transcript;
            document.getElementById('searchTerm').textContent = currentSearchTerm;
            document.getElementById('searchQuery').value = currentSearchTerm;
            resetAndSearch();
        };
        
        voiceRecognition.onerror = function(event) {
            console.error('Voice recognition error:', event.error);
            stopVoiceSearch();
            showError('Voice recognition failed. Please try typing.');
        };
        
        voiceRecognition.onend = function() {
            stopVoiceSearch();
        };
    } else {
        document.getElementById('voiceSearchBtn').style.display = 'none';
        showToast('Voice search not supported in your browser', 'info');
    }
}

// Stop voice search
function stopVoiceSearch() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    voiceBtn.classList.remove('listening');
}

// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchQuery').value.trim();
    if (!searchInput) {
        showError('Please enter a car name to search');
        return;
    }
    
    currentSearchTerm = searchInput;
    document.getElementById('searchTerm').textContent = currentSearchTerm;
    resetAndSearch();
}

// Reset and search
function resetAndSearch() {
    // Update URL
    const newUrl = window.location.pathname + '?q=' + encodeURIComponent(currentSearchTerm);
    window.history.pushState({}, '', newUrl);
    
    // Reset and fetch
    showLoading();
    
    // Validate search term
    isValidCar = validateCarSearch(currentSearchTerm);
    
    if (!isValidCar) {
        showNoCarFound();
        return;
    }
    
    // Hide error messages
    document.getElementById('noCarFound').style.display = 'none';
    document.getElementById('noImagesFound').style.display = 'none';
    
    // Fetch data
    initializePage();
}

// Show loading state
function showLoading() {
    document.getElementById('informationContent').style.display = 'none';
    document.getElementById('imageGallery').style.display = 'none';
    document.getElementById('infoError').style.display = 'none';
    document.getElementById('noCarFound').style.display = 'none';
    document.getElementById('infoLoading').style.display = 'flex';
    document.getElementById('imagesLoading').style.display = 'flex';
}

// Refresh information
function refreshInformation() {
    if (isRefreshing) return;
    
    isRefreshing = true;
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.classList.add('rotating');
    
    fetchCarInformation().finally(() => {
        isRefreshing = false;
        refreshBtn.classList.remove('rotating');
    });
}

// Retry information
function retryInformation() {
    document.getElementById('infoError').style.display = 'none';
    document.getElementById('infoLoading').style.display = 'flex';
    fetchCarInformation();
}

// Retry images
function retryImages() {
    document.getElementById('imagesError').style.display = 'none';
    document.getElementById('imagesLoading').style.display = 'flex';
    fetchCarImages();
}

// Search alternative images
function searchAlternativeImages() {
    const suggestions = getSearchSuggestions(currentSearchTerm);
    if (suggestions.length > 0) {
        searchSuggestion(suggestions[0]);
    }
}

// Go back to search
function goBackToSearch() {
    document.getElementById('searchQuery').focus();
}

// Toggle view mode
function toggleViewMode() {
    const gallery = document.getElementById('imageGallery');
    gallery.classList.toggle('grid-view');
    showToast(gallery.classList.contains('grid-view') ? 'Grid view enabled' : 'Gallery view enabled', 'info');
}

// Fullscreen gallery
function fullscreenGallery() {
    if (images.length > 0 && images[currentImageIndex]) {
        viewFullImage(images[currentImageIndex].url, images[currentImageIndex].title);
    }
}

// View full image
function viewFullImage(url, title) {
    const modal = document.getElementById('imageViewerModal');
    const fullImage = document.getElementById('fullSizeImage');
    const imageTitle = document.getElementById('fullImageTitle');
    const imageSource = document.getElementById('fullImageSource');
    
    // Show loader
    document.getElementById('imageLoader').style.display = 'flex';
    
    // Load image
    fullImage.onload = function() {
        document.getElementById('imageLoader').style.display = 'none';
        imageTitle.textContent = title || 'Car Image';
        imageSource.textContent = 'High Quality Image';
        document.getElementById('fullImageSize').textContent = 'HD Quality';
        document.getElementById('fullImageDate').textContent = 'Latest';
    };
    
    fullImage.onerror = function() {
        document.getElementById('imageLoader').style.display = 'none';
        this.style.display = 'none';
        const container = this.parentElement;
        const fallback = document.createElement('div');
        fallback.className = 'fallback-image';
        fallback.innerHTML = `
            <div>
                <i class="fas fa-image"></i>
                <p class="dark-text">${title}</p>
                <small class="dark-text">Full-size image not available</small>
            </div>
        `;
        container.appendChild(fallback);
    };
    
    fullImage.src = url;
    modal.style.display = 'block';
}

// Close image viewer
function closeImageViewer() {
    document.getElementById('imageViewerModal').style.display = 'none';
}

// Download current image
function downloadCurrentImage() {
    if (images[currentImageIndex]) {
        const imageUrl = images[currentImageIndex].url;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${currentSearchTerm.replace(/\s+/g, '-')}-${currentImageIndex + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Image download started', 'success');
    }
}

// Download all images
function downloadAllImages() {
    showToast('Preparing image archive...', 'info');
}

// Share image
function shareImage() {
    if (navigator.share && images[currentImageIndex]) {
        navigator.share({
            title: `${currentSearchTerm} - Car Image`,
            text: `Check out this ${currentSearchTerm} image from Car Rentals`,
            url: images[currentImageIndex].url
        });
    } else {
        showToast('Web Share API not supported', 'info');
    }
}

// Copy all information
function copyAllInfo() {
    if (!currentCarInfo) return;
    
    const infoText = `
${currentCarInfo.carName} - Complete Details
Manufacturer: ${currentCarInfo.company}
Model Year: ${currentCarInfo.year}

PRICING:
Ex-showroom: ${currentCarInfo.price.exShowroom}
On-road: ${currentCarInfo.price.onRoad}

Variants:
${currentCarInfo.price.variants.map(v => `  ${v.name}: ${v.price}`).join('\n')}

TECHNICAL SPECIFICATIONS:
${Object.entries(currentCarInfo.specifications).map(([k, v]) => `${formatSpecName(k)}: ${v}`).join('\n')}

KEY FEATURES:
${currentCarInfo.keyFeatures.map(f => `• ${f}`).join('\n')}

SAFETY FEATURES:
${currentCarInfo.safetyFeatures.map(f => `• ${f}`).join('\n')}

EXPERT REVIEW:
${currentCarInfo.expertReview}

RATING: ${currentCarInfo.rating}/5

RENTAL PRICES:
Per Hour: ${currentCarInfo.rentalInfo.hourly}
Per Day: ${currentCarInfo.rentalInfo.daily}
Per Week: ${currentCarInfo.rentalInfo.weekly}

--- Information provided by Car Rentals ---
    `.trim();
    
    navigator.clipboard.writeText(infoText)
        .then(() => showToast('All information copied to clipboard!', 'success'))
        .catch(err => showError('Failed to copy: ' + err));
}

// Speak information
function speakInfo() {
    if ('speechSynthesis' in window && currentCarInfo) {
        const speech = new SpeechSynthesisUtterance(`
            ${currentCarInfo.carName}. 
            Manufactured by ${currentCarInfo.company}. 
            ${currentCarInfo.expertReview}
        `);
        speech.rate = 0.9;
        speech.pitch = 1;
        speech.volume = 1;
        speech.lang = 'en-IN';
        window.speechSynthesis.speak(speech);
        showToast('Reading car information...', 'info');
    } else {
        showError('Speech synthesis not supported');
    }
}

// Download PDF
function downloadPDF() {
    showToast('PDF download feature coming soon!', 'info');
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toast.style.background = type === 'error' ? '#e74c3c' : 
                            type === 'info' ? '#2675aaff' : '#3dbd72ff';
    icon.className = type === 'error' ? 'fas fa-exclamation-circle' : 
                     type === 'info' ? 'fas fa-info-circle' : 'fas fa-check-circle';
    messageEl.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showError(message) {
    showToast(message, 'error');
}

// Navigation search
function searchFromNav() {
    const searchInput = document.getElementById('searchInputNav');
    const term = searchInput.value.trim();
    if (term) {
        window.location.href = `search-results.html?q=${encodeURIComponent(term)}`;
    }
}

