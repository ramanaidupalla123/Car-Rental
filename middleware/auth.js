const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Double-check admin role for fixed admin emails
    const isFixedAdmin = User.adminEmails.includes(user.email.toLowerCase());
    if (isFixedAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`🔄 Fixed admin role in middleware for: ${user.email}`);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Admin middleware
// FIXED admin middleware
const admin = async (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check both role and fixed admin emails
    const isAdmin = req.user.role === 'admin' || 
                   User.adminEmails.includes(req.user.email.toLowerCase());
    
    if (isAdmin) {
      // Ensure role is correctly set
      if (User.adminEmails.includes(req.user.email.toLowerCase()) && req.user.role !== 'admin') {
        req.user.role = 'admin';
        await req.user.save();
        console.log(`🔄 Fixed admin role for: ${req.user.email}`);
      }
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin middleware'
    });
  }
};

module.exports = { auth, admin };