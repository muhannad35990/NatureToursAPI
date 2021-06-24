const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //GET THE CURRENTLY BOOKED TOUR
  const tour = await Tour.findById(req.params.tourID);
  console.log(req);
  //create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //array of live images
        amount: tour.price * 100, //amount should be in cents so *100
        currency: 'usd',
        quantity: 1, //number of tours
      },
    ],
  });

  //create session as response
  res.status(200).json({ status: 'success', session });
});
