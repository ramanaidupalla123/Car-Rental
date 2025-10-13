const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
// Add this with other route imports
app.use('/api/reviews', require('./routes/reviews'));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ success: false, message: 'API route not found' });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

const PORT = process.env.PORT || 10000;

// Database connection
const connectDB = require('./config/database');

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚗 Server running on port ${PORT}`);
            console.log(`🔗 http://localhost:${PORT}`);
            console.log(`📱 Mobile ready!`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Temporary test route - remove after testing
app.get('/api/test-cars', async (req, res) => {
  try {
    const Car = require('./models/Car');
    const cars = await Car.find().sort({ createdAt: -1 });
    
    console.log('🔍 Test - Total cars in database:', cars.length);
    console.log('🔍 Test - Cars availability:');
    cars.forEach(car => {
      console.log(`  - ${car.make} ${car.model}: ${car.available}`);
    });
    
    res.json({
      success: true,
      totalCars: cars.length,
      cars: cars.map(car => ({
        make: car.make,
        model: car.model,
        available: car.available,
        _id: car._id
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

startServer();