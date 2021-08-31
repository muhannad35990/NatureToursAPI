const express = require('express');
const {
  getAllTours,
  createTour,
  updateTour,
  getTour,
  deleteTour,
  aliasTopTours,
  aliasTopToursExpense,
  getTourStats,
  getMonthlyPlan,
  getToursWithIn,
  getDistances,
  resizeTourImages,
  uploadTourImages,
  deleteTourImage,
  insertTourLocation,
  deleteTourLocation,
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
router.route('/top-5-expense').get(aliasTopToursExpense, getAllTours);
router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

//get all tours inside distance
//tours-within?distance=233&center=-40,45&unit=mi using query string
///tours-within/233/center/34.111745,-118.113491/unit/mi  using url
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithIn);

//get all distances from the certin point to all the tours
router.route('/distances/:latlng/unit/:unit').get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);
router
  .route('/:id/:img')
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTourImage);
router
  .route('/location/:id')
  .post(protect, restrictTo('admin', 'lead-guide'), insertTourLocation);
router
  .route('/location/:id/:locId')
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTourLocation);

module.exports = router;
