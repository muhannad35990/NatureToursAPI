const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
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
const User = require('../models/userModel');

const router = express.Router();

// called to authenticate using Google-oauth2.0
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }),
  (req, res) => {
    console.log('in the goolge req:', req, 'res:', res);
  }
);
router.get(
  '/google/redirect',
  passport.authenticate('google', {
    failureRedirect: '/login',

    session: false,
  }),
  async (req, res) => {
    const { user } = req;
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
      }
    );

    //save refresh token in the database
    const doc = await User.findByIdAndUpdate(
      user._id,
      { refreshToken: refreshToken },
      {
        new: true,
      }
    );

    //generate new token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    //send the token to client if everything is ok
    user.password = undefined; //remove the password
    res.status(200).json({
      status: 'success',
      message: 'user logged in successfully',
      token,
      refreshToken,
      user: doc,
    });
  }
);

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
router.use('/:userId/Bookings', bookingRouter); //re-routing to booking router to handle

//Middleware to restrict to admin only to all the rest of routes
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
