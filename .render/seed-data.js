const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Car = require('../models/Car');

const seedData = async () => {
  try {
    console.log('🌱 Seeding Naidu Car Rentals database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to car-rental database');
    
    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@naidurentals.com' });
    if (!adminExists) {
      const admin = await User.create({
        name: 'Naidu Admin',
        email: 'admin@naidurentals.com',
        password: 'admin123',
        phone: '9876543210',
        role: 'admin',
        isVerified: true
      });
      console.log('✅ Admin user created');
    }

    // Create sample cars
    const carsData = [
      {
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
        location: {
          address: 'Naidu Rentals, Hyderabad',
          city: 'Hyderabad',
          state: 'Telangana'
        },
        available: true,
        mileage: '15 kmpl',
        engine: '2.0L Turbo',
        color: 'Black'
      },
      {
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
        location: {
          address: 'Naidu Rentals, Hyderabad',
          city: 'Hyderabad',
          state: 'Telangana'
        },
        available: true,
        mileage: '12 kmpl',
        engine: '2.8L Diesel',
        color: 'White'
      },
      {
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
        location: {
          address: 'Naidu Rentals, Hyderabad',
          city: 'Hyderabad',
          state: 'Telangana'
        },
        available: true,
        mileage: '22 kmpl',
        engine: '1.2L Petrol',
        color: 'Red'
      }
    ];

    for (const carData of carsData) {
      const exists = await Car.findOne({ make: carData.make, model: carData.model });
      if (!exists) {
        const admin = await User.findOne({ role: 'admin' });
        carData.createdBy = admin._id;
        await Car.create(carData);
        console.log(`✅ ${carData.make} ${carData.model} added`);
      }
    }

    console.log('🎉 Naidu Car Rentals database seeded successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();