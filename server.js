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
app.use(express.static(path.join(__dirname, 'public')));

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

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve static assets
app.get('/js/:file', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'js', req.params.file));
});

app.get('/css/:file', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'css', req.params.file));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ 
            success: false, 
            message: 'API route not found'
        });
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
    try {
        console.log('🔗 Connecting to Database...');
        await connectDB();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚗 Naidu Car Rentals Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}`);
            console.log(`🔗 Main URL: http://localhost:${PORT}`);
            console.log(`🔗 Admin URL: http://localhost:${PORT}/admin`);
            console.log(`🔗 API URL: http://localhost:${PORT}/api`);
            console.log('🎉 Server is ready!');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('💡 For local development, check MongoDB Atlas IP whitelist');
        console.log('🌐 On Render, this will work automatically');
        process.exit(1);
    }
};

// Start the server
startServer();

module.exports = app; 
