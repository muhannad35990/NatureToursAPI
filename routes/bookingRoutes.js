const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const { getCheckoutSession } = require('../controllers/bookingController');
const {
  getAllBookings,
  createBooking,
  updateBooking,
  getBooking,
  deleteBooking,
} = require('../controllers/bookingController');

const router = express.Router();

router.use(protect);

router.route('/checkout-session/:tourID').post(getCheckoutSession);

router.use(restrictTo('lead-guide', 'admin'));
router.route('/').get(getAllBookings).post(restrictTo('user'), createBooking);
router
  .route('/:id')
  .get(getBooking)
  .patch(restrictTo('user', 'admin'), updateBooking)
  .delete(restrictTo('user', 'admin'), deleteBooking);

module.exports = router;
