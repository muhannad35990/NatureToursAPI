const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Booking must belong to a Tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },
    price: {
      type: Number,
      required: [true, 'Booking must have a price.'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  {
    //options
    //excplicitly tell to show virtual proberties
    toJSON: { virtuals: true }, //when data output as json
    toObject: { virtuals: true }, //when data output as object
  }
);
//prevent user from postng multiple bookings for the same tour
//add compound index and make the combination unique
bookingSchema.index({ tour: 1, user: 1 }, { unique: true });
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({ path: 'tour' });
  next();
});
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
