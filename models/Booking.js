const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'Car is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  rentalType: {
    type: String,
    enum: ['hours', 'days'],
    required: [true, 'Rental type is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 1
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: 0
  },
  pickupLocation: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  dropoffLocation: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  adminNotes: String,
  userFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  hasReview: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-update status based on dates
bookingSchema.methods.updateStatusBasedOnDates = function() {
  const now = new Date();
  
  if (this.status === 'confirmed' && now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else if (this.status === 'active' && now > this.endDate) {
    this.status = 'completed';
  }
};

module.exports = mongoose.model('Booking', bookingSchema);