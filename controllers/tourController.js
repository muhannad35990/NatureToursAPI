const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

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

//middleware to upload 1 cover and 3 images for each tour
//in case do not have cover and only want to upload multiple images
// upload.array('iamges', 5);
//when it's one image
// upload.single('image'); req.file
//when there is mix of them suer upload.fields   req.files
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //process cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //resize with cover option 3/2 ratio
    .toFormat('jpeg') //convert to jpeg
    .jpeg({ quality: 90 }) //compress
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //process rest images array by loop
  req.body.images = [];
  //using promise to force it stop until all loop operations finish
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333) //resize with cover option 3/2 ratio
        .toFormat('jpeg') //convert to jpeg
        .jpeg({ quality: 90 }) //compress
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

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

exports.getToursWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  //divide  by the reduis of the earth to dit in radiance
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  //find tours that start within geo location
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );

  const distances = await Tour.aggregate([
    {
      //always need to be the first stage and need to be geo spatial index
      $geoNear: {
        near: { type: 'Point', coordinates: [lng * 1, lat * 1] }, //to convert to number *1
        distanceField: 'distance', //name of the field of the calculated distances
        distanceMultiplier: multiplier, //to convert to km or mile
      },
    },
    {
      $project: { distance: 1, name: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
