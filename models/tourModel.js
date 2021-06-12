const mongoose = require('mongoose');
var slugify = require('slugify');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
    },

    rating: {
      type: Number,
      default: 4.5,
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
    },
    ratingQantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: Number,
    summery: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover iamge'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false,//to hide this field permenently
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    //options
    //excplicitly tell to show virtual proberties
    toJSON: { virtuals: true }, //when data output as json
    toObject: { virtuals: true }, //when data output as object
  }
);
//adding virtual proberty not saved in the database
tourSchema.virtual('durationWeeks').get(function () {
  //arrow function does not have access to this keyword so use reqular function
  return this.duration / 7;
});

//Document middleware: runs before .save() and .create() only
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true, // convert to lower case, defaults to `false`
  });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('the seconde middleware');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log('the post middleware');
//   console.log(doc);
//   next();
// });

//Query middleware
//find not work for findOne to solve for all find (findOne,findandUpdate,findAndDelete)use reqular expression
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  next();
});
tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  next();
});

//Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  //adding another filter to the begining of the pipeline array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
