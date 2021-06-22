const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); //you can add select in the populte obejct
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null, //make it one group
        // _id: '$difficulty', //stats grouped by difficulty
        _id: { $toUpper: '$difficulty' }, //stats grouped by difficulty and change to upperCase
        numTours: { $sum: 1 }, //count all
        numRatings: { $sum: '$ratingQantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: -1 }, //sort by avgprice 1 for asc and -1 for des
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }, //execlude the easy from the result
    // },
  ]);
  res.status(200).json({ status: 'Sucess', data: { stats } });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //deconstruct an array fiels from the input doc and inbound to diffecnt doc
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }, //array of names of tours for each month
      },
    },
    {
      $addFields: { month: '$_id' }, //add fields
    },
    {
      $project: {
        _id: 0, //0 to remove the field , 1 to show it
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12, //limit number of doc returned to 12
    },
  ]);
  res.status(200).json({ status: 'Sucess', results: plan.length, data: plan });
});
