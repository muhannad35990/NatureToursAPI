const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  //Execute query
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const features = new APIFeatures(Review.find(filter), req.query);

  const reviews = await features.query;
  res
    .status(200)
    .json({ status: 'success', results: reviews.length, data: { reviews } });
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('No review found with this ID', 404));
  }
  res.status(200).json({ status: 'Success', data: review });
});

exports.createReview = catchAsync(async (req, res, next) => {
  //add tour id aand user id
  //allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);
  res.status(201).json({ status: 'success', data: newReview });
});

exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
