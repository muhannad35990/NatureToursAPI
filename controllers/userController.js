const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(200).json({ status: 'success', users });
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

exports.updateUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};
exports.deleteUser = (req, res) => {
  res
    .status(200)
    .json({ date: req.requestTime.toISOString(), status: 'from Users' });
};
