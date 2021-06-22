const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, //new:true to return the updated doc not the old one
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No doc found with this ID', 404));
    }
    res.status(200).json({ status: 'Sucess', data: { doc } });
  });
