const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Car = require('../models/Car');

// Get dashboard statistics
router.get('/stats', auth, admin, async (req, res) => {
  try {
    console.log('📊 Admin: Fetching statistics...');
    
    // Total counts
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeBookings = await Booking.countDocuments({ status: 'active' });
    
    // Revenue calculations
    const totalRevenueResult = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed', 'active'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysBookings = await Booking.countDocuments({
      createdAt: { $gte: today }
    });

    console.log('✅ Admin: Statistics loaded successfully');

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        activeBookings,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        todaysBookings
      }
    });
  } catch (error) {
    console.error('❌ Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// Get all bookings with customer details (Admin only)
router.get('/bookings', auth, admin, async (req, res) => {
  try {
    console.log('📊 Admin: Fetching all bookings...');
    
    const { status, date, limit = 50 } = req.query;

    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by date
    if (date) {
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(filterDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.createdAt = {
        $gte: filterDate,
        $lt: nextDate
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone address')
      .populate('car', 'make model year type registrationNumber color pricePerDay pricePerHour')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    console.log(`✅ Admin: Found ${bookings.length} bookings`);

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('❌ Admin bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// Get booking by ID
router.get('/bookings/:id', auth, admin, async (req, res) => {
  try {
    console.log(`📋 Admin: Fetching booking details for ${req.params.id}`);
    
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('car', 'make model year type color fuelType transmission seats registrationNumber pricePerDay pricePerHour');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('✅ Admin: Booking details loaded successfully');

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('❌ Admin booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});

// Update booking status (Admin)
router.put('/bookings/:id/status', auth, admin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    console.log(`🔄 Admin: Updating booking ${req.params.id} status to ${status}`);
    
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('car', 'make model');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // If confirming a booking, make car unavailable
    if (status === 'confirmed' && booking.status === 'pending') {
      await Car.findByIdAndUpdate(booking.car, { available: false });
    }
    
    // If cancelling a confirmed booking, make car available again
    if (status === 'cancelled' && booking.status === 'confirmed') {
      await Car.findByIdAndUpdate(booking.car, { available: true });
    }

    booking.status = status;
    if (adminNotes) {
      booking.adminNotes = adminNotes;
    }
    booking.updatedAt = new Date();
    await booking.save();

    console.log('✅ Admin: Booking status updated successfully');

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('❌ Admin update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// Get all users (Admin only)
router.get('/users', auth, admin, async (req, res) => {
  try {
    console.log('👥 Admin: Fetching all users...');
    
    const { search } = req.query;

    let query = { role: 'user' };
    
    // Search users by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    // Get booking counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ user: user._id });
        const totalSpentResult = await Booking.aggregate([
          { $match: { user: user._id, status: { $in: ['confirmed', 'completed', 'active'] } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        return {
          ...user.toObject(),
          bookingCount,
          totalSpent: totalSpentResult[0]?.total || 0
        };
      })
    );

    console.log(`✅ Admin: Found ${users.length} users`);
    
    res.json({
      success: true,
      users: usersWithStats
    });
  } catch (error) {
    console.error('❌ Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get all cars (Admin only - with full details)
router.get('/cars', auth, admin, async (req, res) => {
  try {
    console.log('🚗 Admin: Fetching all cars...');

    const cars = await Car.find()
      .sort({ createdAt: -1 });
    
    // Get booking stats for each car
    const carsWithStats = await Promise.all(
      cars.map(async (car) => {
        const bookingCount = await Booking.countDocuments({ car: car._id });
        const totalRevenueResult = await Booking.aggregate([
          { $match: { car: car._id, status: { $in: ['confirmed', 'completed', 'active'] } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);

        return {
          ...car.toObject(),
          bookingCount,
          totalRevenue: totalRevenueResult[0]?.total || 0
        };
      })
    );

    console.log(`✅ Admin: Found ${cars.length} cars`);
    
    res.json({
      success: true,
      cars: carsWithStats
    });
  } catch (error) {
    console.error('❌ Admin cars error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cars',
      error: error.message
    });
  }
});

// Update car availability
router.put('/cars/:id/availability', auth, admin, async (req, res) => {
  try {
    const { available } = req.body;
    
    console.log(`🔄 Admin: Updating car ${req.params.id} availability to ${available}`);
    
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    car.available = available;
    await car.save();

    console.log('✅ Admin: Car availability updated successfully');

    res.json({
      success: true,
      message: 'Car availability updated successfully',
      car
    });
  } catch (error) {
    console.error('❌ Admin update car error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating car availability',
      error: error.message
    });
  }
});

// Get reports and analytics
router.get('/reports', auth, admin, async (req, res) => {
  try {
    console.log('📈 Admin: Generating reports...');
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Booking trends
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Revenue by car type
    const revenueByCarType = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed', 'active'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      {
        $unwind: '$carDetails'
      },
      {
        $group: {
          _id: '$carDetails.type',
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      }
    ]);

    // Popular cars
    const popularCars = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'car',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      {
        $unwind: '$carDetails'
      },
      {
        $group: {
          _id: {
            make: '$carDetails.make',
            model: '$carDetails.model'
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { bookings: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Top customers
    const topCustomers = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $group: {
          _id: '$userDetails._id',
          name: { $first: '$userDetails.name' },
          email: { $first: '$userDetails.email' },
          bookings: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    console.log('✅ Admin: Reports generated successfully');

    res.json({
      success: true,
      reports: {
        period: days,
        bookingTrends,
        revenueByCarType,
        popularCars,
        topCustomers: topCustomers.map(customer => ({
          name: customer.name,
          email: customer.email,
          bookings: customer.bookings,
          totalSpent: customer.totalSpent
        }))
      }
    });
  } catch (error) {
    console.error('❌ Admin reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reports',
      error: error.message
    });
  }
});

module.exports = router;