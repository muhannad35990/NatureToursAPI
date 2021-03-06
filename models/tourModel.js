const mongoose = require('mongoose');
const slugify = require('slugify');
// let  validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'A Tour name must only contain characters'], // use validator lib to check if the name is all letters
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy or medium or difficult',
      },
    },

    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating average must be above 1.0'],
      max: [5, 'rating average must be below 5.0'],
      //run function each time the value set
      //round to int so *10 and .10 to git
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price; //check if the discount less than the acutal price itself only work on the create and not work for update
        },
        message: 'Discount price {{VALUE}} should be below the reqular price ',
      },
    },

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
    startLocation: {
      //embedde object
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], //array of numbers ,lat long
      address: String,
      description: String,
    },
    locations: [
      //array of objects
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }], //link to user schema by reference
  },

  {
    //options
    //excplicitly tell to show virtual proberties
    toJSON: { virtuals: true }, //when data output as json
    toObject: { virtuals: true }, //when data output as object
  }
);

//add indexing to the price field to make the seach faster on this field
//1 for to sort it asc,-1 desc, added more than one field (compund )
//index the field that moslty query
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //indexing geo location use 2d indexing point

//adding virtual proberty not saved in the database
tourSchema.virtual('durationWeeks').get(function () {
  //arrow function does not have access to this keyword so use reqular function
  return this.duration / 7;
});

//virtual populate of tours to get all reviews beacause we use parent referencing so tour does not know about the children
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //id field in the review model that point to the tour
  localField: '_id', //id of the tour in the tour model
});
//Document middleware: runs before .save() and .create() only
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true, // convert to lower case, defaults to `false`
  });
  next();
});

//embedding users with full information in the tours doc, this work only on creating and not on updating
// tourSchema.pre('save', async function (next) {
//   //array of users Id
//   this.guides = await Promise.all(
//     this.guides.map(async (id) => await User.findById(id))
//   ); //array of promises so we wait on all of them
//   next();
// });

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
//to add population of tour with guides in the user model for all queries starts with find
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

tourSchema.post(/^find/, (docs, next) => {
  // console.log(docs);
  next();
});

//Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   //adding another filter to the begining of the pipeline array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
