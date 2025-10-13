const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: function() {
      return this.type === 'car';
    }
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: function() {
      return this.type === 'car';
    }
  },
  type: {
    type: String,
    enum: ['car', 'website'],
    required: [true, 'Review type is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: 1000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'flagged', 'removed'],
    default: 'active'
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  adminResponse: {
    response: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ type: 1, createdAt: -1 });
reviewSchema.index({ car: 1, type: 1 });
reviewSchema.index({ user: 1, type: 1 });
reviewSchema.index({ rating: 1 });

// Static method to get average rating for a car
reviewSchema.statics.getCarAverageRating = async function(carId) {
  const result = await this.aggregate([
    {
      $match: {
        car: carId,
        type: 'car',
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$car',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (result.length > 0) {
    const distribution = result[0].ratingDistribution.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
      distribution
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: {}
  };
};

// Static method to get website average rating
reviewSchema.statics.getWebsiteAverageRating = async function() {
  const result = await this.aggregate([
    {
      $match: {
        type: 'website',
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$type',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews
    };
  }

  return {
    averageRating: 0,
    totalReviews: 0
  };
};

module.exports = mongoose.model('Review', reviewSchema);