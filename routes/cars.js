const express = require('express');
const router = express.Router();
const Car = require('../models/Car');

// Get all available cars
router.get('/', async (req, res) => {
    try {
        console.log('🚗 Fetching all cars from database...');
        
        const cars = await Car.find({ available: true }).sort({ createdAt: -1 });
        
        console.log(`✅ Found ${cars.length} cars in database`);
        
        res.json({
            success: true,
            count: cars.length,
            cars: cars
        });
        
    } catch (error) {
        console.error('❌ Error fetching cars:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cars from database',
            error: error.message
        });
    }
});

// Get single car by ID
router.get('/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }
        
        res.json({
            success: true,
            car: car
        });
        
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching car'
        });
    }
});

module.exports = router;