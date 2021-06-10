const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    //Execute query
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;
    res
      .status(200)
      .json({ status: 'success', results: tours.length, data: { tours } });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: `${err}`,
    });
  }
};
exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({ status: 'Success', data: tour });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      price: req.body.price,
      rating: req.body.rating,
    };

    const newtour = await Tour.create(req.body);
    res.status(201).json({ status: 'Sucess', data: newtour });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ status: 'Sucess', data: { tour } });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(200).json({ status: 'Sucess', data: null });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
    res
      .status(200)
      .json({ status: 'Sucess', results: plan.length, data: plan });
  } catch (err) {
    res.status(404).json({
      status: 'Fail',

      message: err,
    });
  }
};
