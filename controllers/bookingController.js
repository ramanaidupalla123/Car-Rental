const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { validationResult } = require('express-validator');

// Create new booking - IMPROVED VERSION
exports.createBooking = async (req, res) => {
  try {
    console.log('📅 Booking creation attempt:', req.body);
    
    const { carId, startDate, endDate, rentalType, duration, pickupLocation, dropoffLocation } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (start < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    // Check car availability
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    if (!car.available) {
      return res.status(400).json({
        success: false,
        message: 'Car is not available for booking'
      });
    }

    // Check for overlapping bookings
    const existingBooking = await Booking.findOne({
      car: carId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Car is already booked for the selected dates'
      });
    }

    // Calculate total price
    const pricePerUnit = rentalType === 'hours' ? car.pricePerHour : car.pricePerDay;
    const totalPrice = pricePerUnit * duration;

    // Create booking with PENDING status
    const booking = await Booking.create({
      user: req.user.id,
      car: carId,
      startDate: start,
      endDate: end,
      rentalType,
      duration,
      totalPrice,
      status: 'pending',
      pickupLocation: pickupLocation || { 
        address: 'Naidu Car Rentals Main Branch', 
        city: 'Hyderabad' 
      },
      dropoffLocation: dropoffLocation || { 
        address: 'Naidu Car Rentals Main Branch', 
        city: 'Hyderabad' 
      }
    });

    console.log('✅ Booking created with PENDING status:', booking._id);

    // Populate booking details for response
    await booking.populate('car', 'make model year type pricePerDay pricePerHour images');
    
    // Get updated bookings list for the user
    const userBookings = await Booking.find({ user: req.user.id })
      .populate('car', 'make model year type pricePerDay pricePerHour images')
      .sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Waiting for admin approval.',
      booking,
      bookings: userBookings // Send updated bookings list
    });

  } catch (error) {
    console.error('❌ Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('car', 'make model year type pricePerDay pricePerHour images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// User can mark booking as completed
exports.markAsCompleted = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this booking'
      });
    }

    // Only allow completion for active bookings
    if (booking.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active bookings can be marked as completed'
      });
    }

    booking.status = 'completed';
    await booking.save();

    // Make the car available again
    await Car.findByIdAndUpdate(booking.car, { available: true });

    // Get updated bookings list
    const userBookings = await Booking.find({ user: req.user.id })
      .populate('car', 'make model year type pricePerDay pricePerHour images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Booking marked as completed successfully',
      booking,
      bookings: userBookings // Send updated bookings list
    });

  } catch (error) {
    console.error('❌ Mark as completed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// User can cancel booking (only if pending or confirmed)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this booking'
      });
    }

    // Only allow cancellation for pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only pending or confirmed bookings can be cancelled'
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Make the car available again
    await Car.findByIdAndUpdate(booking.car, { available: true });

    // Get updated bookings list
    const userBookings = await Booking.find({ user: req.user.id })
      .populate('car', 'make model year type pricePerDay pricePerHour images')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
      bookings: userBookings // Send updated bookings list
    });

  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};