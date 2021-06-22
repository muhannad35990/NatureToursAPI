const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  updateReview,
  getReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router();

router.route('/').get(protect, getAllReviews).post(createReview);
router
  .route('/:id')
  .get(getReview)
  .patch(updateReview)
  .delete(protect, restrictTo('admin', 'lead-guide', 'user'), deleteReview);

module.exports = router;
