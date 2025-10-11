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
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    
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

    // Total customers
    const totalCustomers = await User.countDocuments({ role: 'user' });

    // Total cars
    const totalCars = await Car.countDocuments();
    const availableCars = await Car.countDocuments({ available: true });

    console.log('✅ Admin: Statistics loaded successfully');

    res.json({
      success: true,
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        todaysBookings,
        totalCustomers,
        totalCars,
        availableCars
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

// Get all bookings with customer details and filters (Admin only)
router.get('/bookings', auth, admin, async (req, res) => {
  try {
    console.log('📊 Admin: Fetching bookings with filters...', req.query);
    
    const { status, date, limit = 100 } = req.query;

    // Build filter object
    let filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date filter
    if (date && date !== 'all') {
      let dateFilter = {};
      
      switch (date) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dateFilter = { 
            createdAt: { $gte: today } 
          };
          break;
          
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { 
            createdAt: { $gte: weekAgo } 
          };
          break;
          
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = { 
            createdAt: { $gte: monthAgo } 
          };
          break;
          
        case 'year':
          const yearAgo = new Date();
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          dateFilter = { 
            createdAt: { $gte: yearAgo } 
          };
          break;
          
        default:
          break;
      }
      
      filter = { ...filter, ...dateFilter };
    }

    console.log('🔍 Applying filters:', filter);

    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone address')
      .populate('car', 'make model year type registrationNumber color pricePerDay pricePerHour fuelType transmission seats')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    console.log(`✅ Admin: Found ${bookings.length} bookings with filters`);

    res.json({
      success: true,
      bookings,
      filter: {
        status: status || 'all',
        date: date || 'all',
        totalCount: bookings.length
      }
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
    const { status } = req.body;
    
    console.log(`🔄 Admin: Updating booking ${req.params.id} status to ${status}`);
    
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    booking.updatedAt = new Date();
    await booking.save();

    // Populate the updated booking for response
    const updatedBooking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('car', 'make model');

    console.log('✅ Admin: Booking status updated successfully');

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: updatedBooking
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
    let filter = {};

    // Search filter
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Get booking statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        try {
          // Get all bookings for this user
          const userBookings = await Booking.find({ user: user._id });
          
          // Calculate basic statistics
          const totalBookings = userBookings.length;
          
          // Calculate total spent from successful bookings only
          const totalSpent = userBookings
            .filter(booking => ['confirmed', 'completed', 'active'].includes(booking.status))
            .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

          return {
            ...user.toObject(),
            bookingCount: totalBookings,
            totalSpent
          };
        } catch (error) {
          console.error(`❌ Error processing user ${user.email}:`, error);
          return {
            ...user.toObject(),
            bookingCount: 0,
            totalSpent: 0
          };
        }
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

// Get single user by ID (Admin only)
router.get('/users/:id', auth, admin, async (req, res) => {
  try {
    console.log(`👤 Admin: Fetching user details for ${req.params.id}`);
    
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's bookings with car details
    const userBookings = await Booking.find({ user: user._id })
      .populate('car', 'make model type year')
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Calculate statistics
    const totalBookings = userBookings.length;
    
    const totalSpent = userBookings
      .filter(booking => ['confirmed', 'completed', 'active'].includes(booking.status))
      .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    const successfulBookings = userBookings.filter(booking => 
      ['confirmed', 'completed', 'active'].includes(booking.status)
    ).length;

    const userStats = {
      totalBookings,
      totalSpent,
      successfulBookings,
      cancelledBookings: userBookings.filter(booking => booking.status === 'cancelled').length
    };

    console.log('✅ Admin: User details loaded successfully');

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: userStats,
        recentBookings: userBookings
      }
    });

  } catch (error) {
    console.error('❌ Admin get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Update user by ID (Admin only)
router.put('/users/:id', auth, admin, async (req, res) => {
  try {
    console.log(`✏️ Admin: Updating user ${req.params.id}...`);
    
    const { name, email, phone, role, address, isActive } = req.body;

    const updateData = {
      name,
      email,
      phone,
      role,
      address,
      isActive,
      updatedAt: Date.now()
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Admin: User updated successfully');

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('❌ Admin update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Make user admin (Permanent admin only) - No password required
router.put('/users/:id/make-admin', auth, admin, async (req, res) => {
  try {
    console.log(`👑 Making user ${req.params.id} admin...`);
    
    // Check if current admin is permanent admin
    const currentAdmin = req.user;
    const permanentAdmins = [
        'ramanaidupalla359@gmail.com',
        'nleelasairamnakka@gmail.com'
    ];
    
    if (!currentAdmin || !permanentAdmins.includes(currentAdmin.email)) {
      return res.status(403).json({
        success: false,
        message: 'Only permanent admin can make users admin'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        role: 'admin',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User ${user.email} made admin successfully`);

    res.json({
      success: true,
      message: 'User made admin successfully',
      user
    });

  } catch (error) {
    console.error('❌ Make admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error making user admin',
      error: error.message
    });
  }
});

// CAR MANAGEMENT ROUTES

// Get all cars (Admin only)
router.get('/cars', auth, admin, async (req, res) => {
  try {
    console.log('🚗 Admin: Fetching all cars...');

    const cars = await Car.find()
      .sort({ createdAt: -1 });

    console.log(`✅ Admin: Found ${cars.length} cars`);
    
    res.json({
      success: true,
      cars: cars
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

// Get single car by ID (Admin only)
router.get('/cars/:id', auth, admin, async (req, res) => {
  try {
    console.log(`🔍 Admin: Fetching car details for ${req.params.id}`);
    
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    console.log('✅ Admin: Car details loaded successfully');

    res.json({
      success: true,
      car
    });
  } catch (error) {
    console.error('❌ Admin get car error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching car',
      error: error.message
    });
  }
});

// Add new car (Admin only)
router.post('/cars', auth, admin, async (req, res) => {
  try {
    console.log('➕ Admin: Adding new car...');
    
    const carData = req.body;

    // Validate required fields
    if (!carData.make || !carData.model || !carData.type) {
      return res.status(400).json({
        success: false,
        message: 'Make, model, and type are required'
      });
    }

    // Set default values
    if (!carData.images || carData.images.length === 0) {
      carData.images = [{
        url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        alt: `${carData.make} ${carData.model}`
      }];
    }

    // Create car
    const car = await Car.create(carData);

    console.log(`✅ Admin: Car added successfully - ${car.make} ${car.model}`);

    res.status(201).json({
      success: true,
      message: 'Car added successfully',
      car
    });
  } catch (error) {
    console.error('❌ Admin add car error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding car',
      error: error.message
    });
  }
});

// Update car by ID (Admin only)
router.put('/cars/:id', auth, admin, async (req, res) => {
  try {
    console.log(`✏️ Admin: Updating car ${req.params.id}...`);
    
    const carData = req.body;

    const car = await Car.findByIdAndUpdate(
      req.params.id,
      carData,
      { new: true, runValidators: true }
    );

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    console.log(`✅ Admin: Car updated successfully - ${car.make} ${car.model}`);

    res.json({
      success: true,
      message: 'Car updated successfully',
      car
    });
  } catch (error) {
    console.error('❌ Admin update car error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating car',
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

// Delete car (Admin only)
router.delete('/cars/:id', auth, admin, async (req, res) => {
  try {
    console.log(`🗑️ Admin: Deleting car ${req.params.id}...`);
    
    const car = await Car.findByIdAndDelete(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    console.log(`✅ Admin: Car deleted successfully - ${car.make} ${car.model}`);

    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('❌ Admin delete car error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting car',
      error: error.message
    });
  }
});

// Get comprehensive reports and analytics
router.get('/reports', auth, admin, async (req, res) => {
  try {
    console.log('📈 Admin: Generating comprehensive reports...');
    
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Summary metrics
    const totalRevenueResult = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed', 'active'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    // Revenue by car type
    const revenueByCarType = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed', 'active'] }
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
      },
      {
        $sort: { revenue: -1 }
      }
    ]);

    // Popular cars by revenue
    const popularCars = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed', 'active'] }
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
          _id: '$carDetails._id',
          make: { $first: '$carDetails.make' },
          model: { $first: '$carDetails.model' },
          type: { $first: '$carDetails.type' },
          revenue: { $sum: '$totalPrice' },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Top customers by spending
    const topCustomers = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed', 'active'] }
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
          phone: { $first: '$userDetails.phone' },
          totalSpent: { $sum: '$totalPrice' },
          successfulBookings: { $sum: 1 }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Booking trends (daily)
    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['confirmed', 'completed', 'active'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Revenue by status
    const revenueByStatus = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Convert revenueByStatus to object format
    const revenueByStatusObj = {};
    revenueByStatus.forEach(item => {
      revenueByStatusObj[item._id] = {
        count: item.count,
        revenue: item.revenue
      };
    });

    console.log('✅ Admin: Comprehensive reports generated successfully');

    res.json({
      success: true,
      reports: {
        period: days,
        summary: {
          totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
          totalBookings: totalRevenueResult[0]?.totalBookings || 0,
          revenueByStatus: revenueByStatusObj
        },
        revenueByCarType,
        popularCars,
        topCustomers,
        bookingTrends
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