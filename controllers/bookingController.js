const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //GET THE CURRENTLY BOOKED TOUR
  const tour = await Tour.findById(req.params.tourID);
  const stripe = Stripe(process.env.STRIPE_KEY);
  //create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${
      req.params.tourID
    }`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        //array of live images
        images: [
          `https://newevolutiondesigns.com/images/freebies/nature-facebook-cover-preview-1.jpg`,
        ],
        amount: tour.price * 100, //amount should be in cents so *100
        currency: 'usd',
        quantity: 1, //number of tours
      },
    ],
  });

  //create session as response
  res.status(200).json({ status: 'success', session });
});

// exports.createBookingCheckout=catchAsync(async(req,res,next)=>{
//   const {tour,user,price}=req,query;
//   if(!tour &&!user&&!price ) return next();
// await Booking.create({tour,user,price})

// res.redirect(re.originalUrl.split('?')[0])
// });

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
