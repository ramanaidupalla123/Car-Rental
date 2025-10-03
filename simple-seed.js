// simple-seed.js - Minimal seed data
require('dotenv').config();
const mongoose = require('mongoose');

// Simple data without requiring all models
const simpleSeed = async () => {
  try {
    console.log('🌱 Starting simple seed...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get database reference
    const db = mongoose.connection.db;
    
    // Create admin user directly
    const usersCollection = db.collection('users');
    const adminExists = await usersCollection.findOne({ email: 'admin@naidurentals.com' });
    
    if (!adminExists) {
      // You'll need to manually hash the password later or use a simple one
      await usersCollection.insertOne({
        name: 'Naidu Admin',
        email: 'admin@naidurentals.com',
        password: 'temp_password', // We'll fix this later
        phone: '9876543210',
        role: 'admin',
        isVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin user created');
    }
    
    // Create sample cars
    const carsCollection = db.collection('cars');
    
    const sampleCars = [
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
        available: true,
        mileage: '15 kmpl',
        engine: '2.0L Turbo',
        color: 'Black',
        createdAt: new Date(),
        updatedAt: new Date()
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
        available: true,
        mileage: '12 kmpl',
        engine: '2.8L Diesel',
        color: 'White',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const car of sampleCars) {
      const exists = await carsCollection.findOne({ make: car.make, model: car.model });
      if (!exists) {
        // Get admin user ID for createdBy field
        const admin = await usersCollection.findOne({ email: 'admin@naidurentals.com' });
        car.createdBy = admin ? admin._id : new mongoose.Types.ObjectId();
        
        await carsCollection.insertOne(car);
        console.log(`✅ ${car.make} ${car.model} added`);
      }
    }
    
    console.log('🎉 Simple seed completed!');
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Seed error:', error.message);
  }
};

simpleSeed();