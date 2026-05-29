const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    console.log('👤 Registration attempt for:', email);
    console.log('📝 Registration data:', { name, email, phone });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });

    console.log(`✅ User registered: ${email} with role: ${user.role}`);

    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.role === 'admin'
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in registration: ' + error.message,
      error: error.message
    });
  }
};

// Login user - COMPLETE FIXED VERSION
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // PERMANENT ADMIN CHECK - Set ramanaidupalla359@gmail.com as permanent admin
    const permanentAdminEmail = 'ramanaidupalla359@gmail.com';
    if (email.toLowerCase() === permanentAdminEmail.toLowerCase()) {
      console.log('👑 Permanent admin detected:', email);
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log('🔄 Updated role to admin for permanent admin');
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Password valid for:', email);

    // Additional admin check for specific emails
    const adminEmails = [
      'ramanaidupalla359@gmail.com',
      'nleelasairamnakka@gmail.com',
      'sreeja@gmail.com'
    ];
    
    const isFixedAdmin = adminEmails.includes(email.toLowerCase());
    if (isFixedAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`🔄 Fixed admin role for: ${email}`);
    }

    console.log(`✅ Login successful: ${email} (Role: ${user.role})`);

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.role === 'admin'
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in login: ' + error.message,
      error: error.message
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.role === 'admin'
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
