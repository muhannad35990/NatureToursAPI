const multer = require('multer');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     //path to where to save user images , if not specified path it will save it in the memory
//     cb(null, 'public/img/users'); //null mean no error
//   },
//   filename: (req, file, cb) => {
//     //user-32434224-234234234.jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage(); //store image in buffer
//filter for multer to test if the uploaded file is image
const multerFilter = (re1, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not and image! Please upload only images', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');
//resize uploaded image to make it square
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500) //resize with cover option
    .toFormat('jpeg') //convert to jpeg
    .jpeg({ quality: 90 }) //compress
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.getMe = (req, res, next) => {
  //middleware to midify the id before call getOne to get the current user information
  req.params.id = req.user.id;
  next();
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
  const filteredBody = filterObj(req.body, 'FirstName', 'LastName', 'email'); //keep only these fields to be allowed to update
  //add photo if uploaded one
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    //new:true to return the updated doc not the old one
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    message: 'Successfully updated!',
    user: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    message: 'deleted successfully!',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! please uesr /signUp instead',
  });
};
exports.OAuthRedirection = catchAsync(async (req, res, next) => {
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
  res.redirect(`${process.env.CLIENT_REDIRECT}/${refreshToken}`);
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User); //you can add select in the populte obejct
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
