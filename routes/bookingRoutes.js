const express = require('express');
const { protect, restrictTo } = require('../controllers/authController');
const { getCheckoutSession } = require('../controllers/bookingController');

const router = express.Router();

router.route('/checkout-session/:tourID').post(getCheckoutSession);

module.exports = router;
