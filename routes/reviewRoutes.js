const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const {
  getAllReviews,
  createReview,
  updateReview,
  getReview,
  deleteReview,
  setTourUserIds,
} = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true }); //mergeParams allow to access to tourId in the other router

//POST /tour/234sdf23/reviews is the same as  POST /reviews
//protect all the rest of routes
router.use(protect);
router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);
router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
