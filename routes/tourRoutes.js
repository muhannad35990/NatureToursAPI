const express = require('express');
const {
  getAllTours,
  createTour,
  updateTour,
  getTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
} = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();
//Middleware check if there is id in the request parameters
// router.param('id', (req, res, next, val) => {
//   next();
// });

router.use('/:tourId/reviews', reviewRouter); //re-routing to review router to handle

router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/').get(protect, getAllTours).post(createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

//POST GET /tour/23432dsfdsf342/reviews
// router
//   .route('/:tourId/reviews')
//   .get(protect, restrictTo('user'), reviewController.getReview)
//   .post(protect, restrictTo('user'), reviewController.createReview);
module.exports = router;
