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
  features: [String],
  images: [{
    url: String,
    alt: String
  }],
  available: { 
    type: Boolean, 
    default: true 
  },
  color: String,
  mileage: String,
  location: {
    address: { type: String, default: 'Naidu Car Rentals Main Branch' },
    city: { type: String, default: 'Hyderabad' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Car', carSchema);