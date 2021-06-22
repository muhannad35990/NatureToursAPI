const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  updateReview,
  getReview,
  deleteReview,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true }); //mergeParams allow to access to tourId in the other router

//POST /tour/234sdf23/reviews is the same as  POST /reviews
router.route('/').get(protect, getAllReviews).post(protect, createReview);
router
  .route('/:id')
  .get(protect, getReview)
  .patch(protect, updateReview)
  .delete(protect, restrictTo('user'), deleteReview);

module.exports = router;
