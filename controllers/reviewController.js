const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { validationResult } = require('express-validator');

exports.createReview = async (req, res) => {
  try {
    console.log('📝 Creating new review...', req.body);
    console.log('👤 User ID:', req.user.id);
    const { type, rating, title, comment, bookingId, carId } = req.body;

    // Validate required fields
    if (!type || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Type, rating, title, and comment are required fields'
      });
    }
    // DEBUG: Log all received fields
    console.log('📋 Received review data:', {
      type,
      rating,
      title,
      comment,
      bookingId,
      carId,
      user: req.user.id
    });

    // Validate required fields
    if (!type || !rating || !title || !comment) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Type, rating, title, and comment are required fields'
      });
    }
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check for duplicate submission (same user, same content within last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const duplicateReview = await Review.findOne({
      user: req.user.id,
      type: type,
      title: title,
      comment: comment,
      rating: rating,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (duplicateReview) {
      console.log('⚠️ Duplicate review submission detected');
      return res.status(400).json({
        success: false,
        message: 'Duplicate review submission detected. Please wait a few minutes before submitting again.'
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

      // Check if booking exists and belongs to user
      const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id
      });

      if (!booking) {
        return res.status(400).json({
          success: false,
          message: 'No booking found for this user'
        });
      }

      // Check if user already reviewed this booking (only for car reviews)
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

    // For website reviews, check if user submitted too many recently (prevent spam)
    if (type === 'website') {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentWebsiteReviews = await Review.countDocuments({
        user: req.user.id,
        type: 'website',
        createdAt: { $gte: oneDayAgo }
      });

      // Allow up to 3 website reviews per day to prevent spam
      if (recentWebsiteReviews >= 3) {
        return res.status(400).json({
          success: false,
          message: 'You have reached the daily limit for website reviews. Please try again tomorrow.'
        });
      }
    }

    // Create review
    const reviewData = {
      user: req.user.id,
      type,
      rating: parseInt(rating),
      title,
      comment
    };

    if (type === 'car') {
      reviewData.booking = bookingId;
      reviewData.car = carId;
    }

    console.log('📝 Creating review with data:', reviewData);
    
    const review = await Review.create(reviewData);

    // Populate user details for response
    await review.populate('user', 'name');

    // Update booking hasReview flag for car reviews
    if (type === 'car') {
      await Booking.findByIdAndUpdate(bookingId, { hasReview: true });
      
      // Update car ratings
      await updateCarRatings(carId);
    }

    console.log('✅ Review created successfully:', review._id);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });

  } catch (error) {
    console.error('❌ Create review error:', error);
    
    // Handle duplicate key errors (MongoDB unique constraint violations)
    if (error.code === 11000) {
      // Check if it's a car review duplicate
      if (error.keyPattern && error.keyPattern.booking) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this booking.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Duplicate review detected. Please wait a few minutes before submitting again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating review: ' + error.message,
      error: error.message
    });
  }
};

// Get reviews with filters - FIXED VERSION (show all active reviews to users)
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

    // Build filter object - Only show active reviews to users
    let filter = { status: 'active' };
    
    if (type && type !== 'all') filter.type = type;
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

    // Get average ratings from ACTIVE reviews only
    let averageRatings = {};
    const activeReviewsFilter = { status: 'active' };
    
    if (type === 'car' && carId) {
      activeReviewsFilter.type = 'car';
      activeReviewsFilter.car = carId;
      averageRatings = await Review.getCarAverageRating(carId);
    } else if (type === 'website') {
      activeReviewsFilter.type = 'website';
      averageRatings = await Review.getWebsiteAverageRating();
    } else {
      // Get overall average from all active reviews
      const overallStats = await Review.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);
      
      if (overallStats.length > 0) {
        averageRatings = {
          averageRating: Math.round(overallStats[0].averageRating * 10) / 10,
          totalReviews: overallStats[0].totalReviews
        };
      }
    }

    console.log(`📝 User Reviews API: Found ${reviews.length} active reviews, Total: ${total}`);
    
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