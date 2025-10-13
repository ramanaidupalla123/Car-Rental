const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createReview,
  getReviews,
  getMyReviews,
  markHelpful,
  reportReview,
  deleteMyReview
} = require('../controllers/reviewController');

// Public routes
router.get('/', getReviews);

// Protected routes
router.post('/', auth, createReview);
router.get('/my-reviews', auth, getMyReviews);
router.put('/:id/helpful', auth, markHelpful);
router.post('/:id/report', auth, reportReview);
router.delete('/:id', auth, deleteMyReview);

module.exports = router;