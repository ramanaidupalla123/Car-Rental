const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { 
    type: String, 
    required: [true, 'Car make is required'] 
  },
  model: { 
    type: String, 
    required: [true, 'Car model is required'] 
  },
  year: { 
    type: Number, 
    required: [true, 'Manufacturing year is required'],
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  type: { 
    type: String, 
    required: [true, 'Car type is required'],
    enum: ['SUV', 'Sedan', 'Hatchback', 'MPV', 'Luxury', 'Sports']
  },
  pricePerDay: { 
    type: Number, 
    required: [true, 'Price per day is required'],
    min: 0
  },
  pricePerHour: { 
    type: Number, 
    required: [true, 'Price per hour is required'],
    min: 0
  },
  fuelType: { 
    type: String, 
    required: true,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid']
  },
  transmission: { 
    type: String, 
    required: true,
    enum: ['Manual', 'Automatic']
  },
  seats: { 
    type: Number, 
    required: true,
    min: 2,
    max: 12
  },
  registrationNumber: { 
    type: String, 
    unique: true,
    sparse: true
  },
  features: { 
    type: [String], 
    default: ['AC', 'Music System', 'Power Steering']
  },
  images: [{
    url: { 
      type: String, 
      default: 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    },
    alt: String
  }],
  available: { 
    type: Boolean, 
    default: true 
  },
  color: { type: String, default: 'White' },
  mileage: { type: String, default: '15 kmpl' },
  location: {
    address: { type: String, default: 'Car Rentals Main Branch' },
    city: { type: String, default: 'Hyderabad' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: String,
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Middleware to ensure at least one image exists
carSchema.pre('save', function(next) {
  if (!this.images || this.images.length === 0) {
    this.images = [{
      url: 'https://images.unsplash.com/photo-1563720223481-83a56b9ecd6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      alt: `${this.make} ${this.model}`
    }];
  }
  next();
});

module.exports = mongoose.model('Car', carSchema);