const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No doc found with this ID', 404));
    }
    res.status(204).json({ status: 'Sucess' });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let doc;
    if (req.body.images) {
      doc = await Model.updateOne(
        { _id: req.params.id },
        { $addToSet: { images: { $each: req.body.images } } },
        {
          new: true, //new:true to return the updated doc not the old one
          runValidators: true,
        }
      );
    } else {
      doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true, //new:true to return the updated doc not the old one
        runValidators: true,
      });
    }
    if (!doc) {
      return next(new AppError('No doc found with this ID', 404));
    }
    res.status(200).json({ status: 'Sucess', data: { doc } });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({ status: 'Sucess', data: newDoc });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions); //populate the virtual field in the model
    const doc = await query;
    if (!doc) {
      return next(new AppError('No doc found with this ID', 404));
    }
    res.status(200).json({ status: 'Success', data: doc });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //Execute query
    //To allow for nested GET reviews on tour

    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    if (req.params.userId) filter = { user: req.params.userId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await features.query;
    res
      .status(200)
      .json({ status: 'success', results: docs.length, data: { docs } });
  });
