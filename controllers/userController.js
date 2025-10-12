const User = require('../models/User');
const Booking = require('../models/Booking');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isVerified
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }
    
    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ avgRating: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get single user by ID (Admin only)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's bookings statistics
    const bookingsStats = await Booking.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments({ user: user._id });
    const totalSpent = await Booking.aggregate([
      { $match: { user: user._id, status: { $in: ['completed', 'active'] } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    const userStats = {
      totalBookings,
      totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
      bookingsByStatus: bookingsStats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, amount: stat.totalAmount };
        return acc;
      }, {})
    };

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: userStats
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get current user profile
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's recent bookings
    const recentBookings = await Booking.find({ user: req.user.id })
      .populate('car', 'make model images pricePerDay')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get booking statistics
    const bookingStats = await Booking.aggregate([
      { $match: { user: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalPrice' }
        }
      }
    ]);

    const stats = bookingStats.reduce((acc, stat) => {
      acc[stat._id] = { count: stat.count, amount: stat.totalAmount };
      return acc;
    }, {});

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        recentBookings,
        stats
      }
    });

  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile (Current user)
exports.updateMyProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, address, licenseNumber } = req.body;

    // Check if email is being changed and if it's already taken
    if (req.body.email && req.body.email !== req.user.email) {
      const emailExists = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.user.id }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = {
      name,
      phone,
      address,
      licenseNumber,
      updatedAt: Date.now()
    };

    // Add email if provided and different
    if (req.body.email && req.body.email !== req.user.email) {
      updateData.email = req.body.email;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Change password (Current user)
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Add user rating (Admin only)
exports.addUserRating = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add new rating
    user.ratings.push({
      rating,
      comment,
      createdAt: new Date()
    });

    // Update average rating
    user.updateAverageRating();
    await user.save();

    res.json({
      success: true,
      message: 'Rating added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avgRating: user.avgRating,
        totalRatings: user.ratings.length
      }
    });

  } catch (error) {
    console.error('Add user rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding rating',
      error: error.message
    });
  }
};

// Get user ratings (Admin only)
exports.getUserRatings = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('ratings avgRating name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avgRating: user.avgRating,
        ratings: user.ratings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      }
    });

  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ratings',
      error: error.message
    });
  }
};

// Get top rated customers (Admin only)
exports.getTopRatedCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topCustomers = await User.find({ 
      role: 'user',
      avgRating: { $gt: 0 }
    })
    .select('name email phone avgRating ratings createdAt')
    .sort({ avgRating: -1, 'ratings.length': -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      count: topCustomers.length,
      customers: topCustomers
    });

  } catch (error) {
    console.error('Get top rated customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top rated customers',
      error: error.message
    });
  }
};

// Update user by ID (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, role, isVerified, address, licenseNumber } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const emailExists = await User.findOne({ 
        email: email,
        _id: { $ne: req.params.id }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = {
      name,
      email,
      phone,
      role,
      isVerified,
      address,
      licenseNumber,
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

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active bookings
    const activeBookings = await Booking.findOne({
      user: req.params.id,
      status: { $in: ['confirmed', 'active'] }
    });

    if (activeBookings) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active bookings'
      });
    }

    // Archive user data instead of permanent deletion
    user.email = `deleted_${Date.now()}_${user.email}`;
    user.phone = `deleted_${Date.now()}_${user.phone}`;
    user.name = 'Deleted User';
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};