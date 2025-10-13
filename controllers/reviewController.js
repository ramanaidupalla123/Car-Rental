const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { validationResult } = require('express-validator');

// Create new review
exports.createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, rating, title, comment, bookingId, carId } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // For car reviews, verify booking exists and user completed it
    if (type === 'car') {
      if (!bookingId || !carId) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID and Car ID are required for car reviews'
        });
      }

      const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id,
        status: 'completed'
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: 'No completed booking found for this user and car'
        });
      }

      // Check if user already reviewed this booking
      const existingReview = await Review.findOne({
        user: req.user.id,
        booking: bookingId,
        type: 'car'
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this booking'
        });
      }
    }

    // For website reviews, check if user reviewed recently (limit 1 per month)
    if (type === 'website') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const recentReview = await Review.findOne({
        user: req.user.id,
        type: 'website',
        createdAt: { $gte: oneMonthAgo }
      });

      if (recentReview) {
        return res.status(400).json({
          success: false,
          message: 'You can only submit one website review per month'
        });
      }
    }

    // Create review
    const reviewData = {
      user: req.user.id,
      type,
      rating,
      title,
      comment
    };

    if (type === 'car') {
      reviewData.booking = bookingId;
      reviewData.car = carId;
    }

    const review = await Review.create(reviewData);

    // Populate user details for response
    await review.populate('user', 'name avatar');

    // Update booking hasReview flag for car reviews
    if (type === 'car') {
      await Booking.findByIdAndUpdate(bookingId, { hasReview: true });
      
      // Update car ratings
      await updateCarRatings(carId);
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Get reviews with filters
exports.getReviews = async (req, res) => {
  try {
    const {
      type,
      carId,
      page = 1,
      limit = 10,
      sort = 'newest',
      rating,
      verified
    } = req.query;

    // Build filter object
    let filter = { status: 'active' };
    
    if (type) filter.type = type;
    if (carId) filter.car = carId;
    if (rating) filter.rating = parseInt(rating);
    if (verified !== undefined) filter.isVerified = verified === 'true';

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'highest':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOption = { helpfulCount: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const reviews = await Review.find(filter)
      .populate('user', 'name avatar')
      .populate('car', 'make model images')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(filter);

    // Get average ratings
    let averageRatings = {};
    if (type === 'car' && carId) {
      averageRatings = await Review.getCarAverageRating(carId);
    } else if (type === 'website') {
      averageRatings = await Review.getWebsiteAverageRating();
    }

    res.json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      averageRatings,
      reviews
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get user's reviews
exports.getMyReviews = async (req, res) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    let filter = { user: req.user.id };
    if (type) filter.type = type;

    const reviews = await Review.find(filter)
      .populate('car', 'make model images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(filter);

    // Get user's average ratings
    const carReviews = await Review.find({ user: req.user.id, type: 'car' });
    const websiteReviews = await Review.find({ user: req.user.id, type: 'website' });

    const averageRatings = {
      car: carReviews.length > 0 ? 
        carReviews.reduce((sum, review) => sum + review.rating, 0) / carReviews.length : 0,
      website: websiteReviews.length > 0 ? 
        websiteReviews.reduce((sum, review) => sum + review.rating, 0) / websiteReviews.length : 0
    };

    res.json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      averageRatings,
      reviews
    });

  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Update review helpful count
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked this review
    const hasLiked = review.likes.includes(req.user.id);
    const hasDisliked = review.dislikes.includes(req.user.id);

    if (req.query.action === 'helpful') {
      if (hasLiked) {
        // Remove like
        review.likes.pull(req.user.id);
        review.helpfulCount = Math.max(0, review.helpfulCount - 1);
      } else {
        // Add like and remove dislike if exists
        review.likes.push(req.user.id);
        if (hasDisliked) {
          review.dislikes.pull(req.user.id);
        }
        review.helpfulCount += 1;
      }
    } else if (req.query.action === 'not-helpful') {
      if (hasDisliked) {
        // Remove dislike
        review.dislikes.pull(req.user.id);
      } else {
        // Add dislike and remove like if exists
        review.dislikes.push(req.user.id);
        if (hasLiked) {
          review.likes.pull(req.user.id);
          review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        }
      }
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review feedback updated',
      helpfulCount: review.helpfulCount,
      likes: review.likes.length,
      dislikes: review.dislikes.length
    });

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review feedback',
      error: error.message
    });
  }
};

// Report review
exports.reportReview = async (req, res) => {
  try {
    const { reason } = req.body;

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.reportCount += 1;
    
    // Auto-flag if multiple reports
    if (review.reportCount >= 3) {
      review.status = 'flagged';
    }

    await review.save();

    res.json({
      success: true,
      message: 'Review reported successfully',
      reportCount: review.reportCount
    });

  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting review',
      error: error.message
    });
  }
};

// Delete user's own review
exports.deleteMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or access denied'
      });
    }

    // Update car ratings if it's a car review
    if (review.type === 'car') {
      await updateCarRatings(review.car);
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Helper function to update car ratings
async function updateCarRatings(carId) {
  try {
    const ratings = await Review.aggregate([
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

    if (ratings.length > 0) {
      const distribution = ratings[0].ratingDistribution.reduce((acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      await Car.findByIdAndUpdate(carId, {
        averageRating: Math.round(ratings[0].averageRating * 10) / 10,
        totalReviews: ratings[0].totalReviews,
        ratingDistribution: distribution
      });
    } else {
      await Car.findByIdAndUpdate(carId, {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }
  } catch (error) {
    console.error('Error updating car ratings:', error);
  }
}