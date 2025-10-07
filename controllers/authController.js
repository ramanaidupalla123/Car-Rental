const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const emailService = require('../services/emailService');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    console.log('👤 Registration attempt for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const userData = {
      name,
      email,
      password,
      phone
    };

    if (address) {
      if (typeof address === 'string') {
        userData.address = { street: address };
      } else {
        userData.address = address;
      }
    }

    const user = await User.create(userData);

    console.log(`✅ User registered: ${email} with role: ${user.role}`);

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

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);
    console.log('📝 Password provided length:', password ? password.length : 0);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('👤 User found:', user.email);
    console.log('🗄️ Stored password hash exists:', !!user.password);

    const isPasswordValid = await user.comparePassword(password);
    console.log('🔑 Password validation result:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const adminEmails = [
      'ramanaidupalla359@gmail.com',
      'nleelasairamnakka@gmail.com'
    ];
    
    const isFixedAdmin = adminEmails.includes(email.toLowerCase());
    if (isFixedAdmin && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
      console.log(`🔄 Fixed admin role for: ${email}`);
    }

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
      message: 'Error in login: ' + error.message
    });
  }
};

// Get current user
const getMe = async (req, res) => {
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

// Send OTP via Email Only
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log(`📧 OTP request received for email:`, email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account exists with this email, an OTP has been sent'
      });
    }

    console.log('👤 User found:', user.email);

    // Generate 6-digit OTP - 10 MINUTES EXPIRY
    const otp = generateOTP();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save OTP to user
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpire = otpExpire;
    user.otpMethod = 'email';
    
    await user.save();

    console.log('🔢 OTP generated for user:', user.email);
    console.log('🎯 OTP (for manual testing):', otp);
    console.log('⏰ OTP expires at:', new Date(otpExpire).toLocaleString());

    try {
      console.log('📤 Attempting to send OTP to:', user.email);
      
      const emailResult = await emailService.sendOTP(user.email, otp);
      
      console.log('✅ Email sent successfully to:', user.email);
      
      res.json({
        success: true,
        message: 'Verification code has been sent to your email address',
        method: 'email',
        provider: emailResult.provider,
        expiresIn: 600 // 10 minutes in seconds
      });
      
    } catch (emailError) {
      console.error('❌ Email delivery failed to:', user.email);
      console.error('📧 Email error details:', emailError.message);
      
      // Still return success but with manual OTP
      res.json({
        success: true,
        message: `Email delivery issue. Please use this OTP: ${otp}`,
        method: 'email',
        provider: 'manual',
        expiresIn: 600, // 10 minutes
        debugOtp: otp
      });
    }

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP process: ' + error.message
    });
  }
};

// Verify OTP and reset password
const verifyOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    console.log('🔄 Password reset request received:', { 
      email, 
      otp, 
      newPasswordLength: newPassword?.length 
    });

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user by email and check OTP
    const user = await User.findOne({
      email: email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log('❌ Invalid OTP or OTP expired for:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP or OTP has expired'
      });
    }

    console.log('✅ OTP verified for user:', {
      id: user._id,
      email: user.email,
      name: user.name
    });

    // Set the new password
    user.password = newPassword;
    
    // Clear OTP fields
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    user.otpMethod = undefined;
    
    // Save the user
    await user.save();
    
    console.log('💾 Password updated successfully for:', user.email);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
      userEmail: user.email
    });

  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset: ' + error.message
    });
  }
};

// Check if user exists for forgot password
const checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with provided email'
      });
    }

    res.json({
      success: true,
      message: 'User found',
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name
      }
    });

  } catch (error) {
    console.error('❌ Check user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export all functions
module.exports = {
  register,
  login,
  getMe,
  sendResetOTP,
  verifyOTPAndResetPassword,
  checkUserExists
};