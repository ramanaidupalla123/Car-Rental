const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
    origin: true,
    credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Database connection
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const carRoutes = require('./routes/cars');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Naidu Car Rentals API is healthy 🚗',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        environment: process.env.NODE_ENV
    });
});

// Test admin route directly
app.get('/api/admin/test', (req, res) => {
    res.json({
        success: true,
        message: 'Admin route is working!',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌';
    
    res.json({ 
        message: '🚗 Welcome to Naidu Car Rentals API',
        version: '1.0.0',
        database: dbStatus,
        environment: process.env.NODE_ENV,
        endpoints: {
            auth: '/api/auth',
            users: '/api/users', 
            cars: '/api/cars',
            bookings: '/api/bookings',
            admin: '/api/admin',
            health: '/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 404 handler - FIXED: Use express default 404 handling
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found',
        path: req.originalUrl,
        availableEndpoints: [
            '/',
            '/health',
            '/api/auth/login',
            '/api/auth/register', 
            '/api/auth/me',
            '/api/users/profile',
            '/api/cars',
            '/api/bookings',
            '/api/bookings/my-bookings',
            '/api/admin/stats',
            '/api/admin/bookings',
            '/api/admin/users'
        ]
    });
});

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚗 Naidu Car Rentals Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
            console.log(`🔗 API URL: http://localhost:${PORT}`);
            console.log('🎉 Server is ready! Database connection established.');
            console.log('\n📋 Available Endpoints:');
            console.log('   - GET  /health');
            console.log('   - GET  /');
            console.log('   - POST /api/auth/login');
            console.log('   - POST /api/auth/register');
            console.log('   - GET  /api/cars');
            console.log('   - GET  /api/admin/stats');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app;