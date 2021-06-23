const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  {
    //options
    //excplicitly tell to show virtual proberties
    toJSON: { virtuals: true }, //when data output as json
    toObject: { virtuals: true }, //when data output as object
  }
);
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'user',
  //   select: 'name',
  // }).populate({
  //   path: 'tour',
  //   select: 'name photo',
  // });
  //no need to populate the tour not overlap the data when get tour and populate with reviews
  this.populate({
    path: 'user',
    select: 'name',
  });
  next();
});

//static method to calculate statistics
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //using aggregation pipeline
  //match to get all review belong to tour with that tourId
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour', //group by tour
        nRating: { $sum: 1 }, //count number of ratings (number of reviews)
        avgRating: { $avg: '$rating' }, //average of rating
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingAverage: stats[0].avgRating,
    ratingQantity: stats[0].nRating,
  });
};

//middleware to update call updating statistic and save to the doc in the Tour
reviewSchema.post('save', function () {
  //this points to current review , coz we do not have access yet the the Review Model we use constructor to get around
  this.constructor.calcAverageRatings(this.tour); //call the static method to calclate
});
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
