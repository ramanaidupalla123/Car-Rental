const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createBooking, getUserBookings, updateBookingStatus, markAsCompleted, cancelBooking } = require('../controllers/bookingController');

// Create booking
router.post('/', auth, createBooking);

// Get user bookings
router.get('/my-bookings', auth, getUserBookings);

// User marks booking as completed
router.put('/:id/complete', auth, markAsCompleted);

// User cancels booking
router.put('/:id/cancel', auth, cancelBooking);

module.exports = router;