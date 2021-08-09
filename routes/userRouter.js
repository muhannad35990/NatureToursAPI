const express = require('express');

const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  autologin,
} = require('../controllers/authController');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');
const reviewRouter = require('./reviewRoutes');
const bookingRouter = require('./bookingRoutes');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.post('/autologin', autologin);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

//Middleware to protect all routes after
router.use(protect);

router.patch('/updateMyPassword', updatePassword);

router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe); //upload.signle upload single file
router.delete('/deleteMe', deleteMe);
router.get('/getMe', getMe, getUser);

router.use('/:userId/reviews', reviewRouter); //re-routing to review router to handle
router.use('/:userId/Bookings', bookingRouter); //re-routing to review router to handle

//Middleware to restrict to admin only to all the rest of routes
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
