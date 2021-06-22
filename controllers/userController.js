const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ status: 'success', users });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //create error if user posted password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please user /updateMypassword .',
        400
      )
    );
  }
  //update user
  const filteredBody = filterObj(req.body, 'name', 'email'); //keep only these fields to be allowed to update
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    //new:true to return the updated doc not the old one
    new: true,
    runValidators: true,
  });
  res.status(200).json({ status: 'success', user: updatedUser });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  res
    .status(200)
    .json({ status: 'fail', data: 'this route is not yet defiend' });
};

exports.createUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
