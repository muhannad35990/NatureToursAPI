const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const refreshSignToken = (id) =>
  jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
const createSendToken = async (user, statusCode, message, res) => {
  //refresh token

  const refreshToken = refreshSignToken(user._id);

  //save refresh token in the database
  const doc = await User.findByIdAndUpdate(
    user._id,
    { refreshToken: refreshToken },
    {
      new: true,
    }
  );

  //generate new token
  const token = signToken(user._id);
  //send the token to client if everything is ok
  user.password = undefined; //remove the password
  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    refreshToken,
    user: doc,
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  //in production
  // const url = `${req.protocol}://${req.get('host')}/me`;
  //in local
  const url = `http://localhost:3001/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, 'user created successfully', res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //check if the user exists and the password is correct
  //we need to explicitly get the password coz by default we marked it unselected
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 400));
  }
  createSendToken(user, 200, 'logged in success!', res);
});

exports.autologin = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return next(
        new AppError(
          "Can't auto login , Please login using username and password",
          400
        )
      );
    }
    //check if refresh token is still valid
    //verification token

    const decoded = await promisify(jwt.verify)(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //check if the user still exists and not deleted in the meanTime
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user)
      return next(
        new AppError(
          'The user belonging to this token does no longer exists.',
          401
        )
      );

    //get the user referesh token saved
    if (
      !user ||
      !(await user.correctRefreshToken(refreshToken, user.refreshToken))
    ) {
      return next(new AppError('Incorrect refresh token', 401));
    }

    createSendToken(user, 200, 'Auto login success!', res);
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return next(
        new AppError('The refresh Token Expired ,try login again.', 401)
      );
    }
  }
});
exports.protect = catchAsync(async (req, res, next) => {
  //getting token and check if it's exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token)
    return next(new AppError('You are not logged in to get access.', 401));
  try {
    //verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //check if the user still exists and not deleted in the meanTime
    const freshUser = await User.findById(decoded.id);
    if (!freshUser)
      return next(
        new AppError(
          'The user belonging to this token does no longer exists.',
          401
        )
      );
    //check if user change password after jwt was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }
    //at this point grant access to protected Route , add user data  to the request
    req.user = freshUser;
    next();
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return next(
        new AppError('The Token Expired ,try to refresh or again again.', 401)
      );
    }
  }
});

//can not pass parameters to middleware so wrap it into another function
exports.restrictTo =
  (...rols) =>
  (req, res, next) => {
    if (!rols.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('there is no user with the email address', 404));

  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    //send it to user's email
    //on production
    // const resetURL = `${req.protocol}://${req.get(
    //   'host'
    // )}/api/v1/users/resetPassword/${resetToken}`;

    //for local
    const resetURL = `http://localhost:3001/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Please check your email ,link sent to reset your password',
    });
  } catch (err) {
    user.passwordRestToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'there was an error sending the email. try again later!a',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //get user base on the token and encypt to compaire with the one saved on the database
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  //get the user and check if the token has expired
  const user = await User.findOne({
    passwordRestToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //if token has not expired and there is user ,set the new password
  if (!user) return next(new AppError('token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordRestToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //log the user in ,send JWT
  createSendToken(user, 200, 'Password reset success!', res);

  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get the user
  const user = await User.findById(req.user.id).select('+password');

  //check if posted current password is correct
  if (!user.correctPassword(req.body.passwordCurrent, user.password))
    return next(new AppError('Your current password is incorrect', 401));

  //update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //log in user and send new token

  createSendToken(user, 200, 'Password updated successfully!', res);
});
