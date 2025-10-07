const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  drivingLicense: {
    number: String,
    expiryDate: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordOTP: String,
  resetPasswordOTPExpire: Date

}, {
  timestamps: true
});

// Define fixed admin emails
userSchema.statics.adminEmails = [
  'ramanaidupalla359@gmail.com',
  'nleelasairamnakka@gmail.com'
];

// Auto-detect admin based on email
userSchema.pre('save', function(next) {
  if (this.constructor.adminEmails.includes(this.email.toLowerCase())) {
    this.role = 'admin';
    console.log(`✅ Auto-assigned admin role to: ${this.email}`);
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.constructor.adminEmails.includes(this.email.toLowerCase());
};

module.exports = mongoose.model('User', userSchema);