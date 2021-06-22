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

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! please uesr /signUp instead',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User); //you can add select in the populte obejct
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
