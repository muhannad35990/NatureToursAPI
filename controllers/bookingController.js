const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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
    //this url is just to test
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`,
    // success_url: `${req.protocol}://${req.get('host')}/myBookings`,
    // cancel_url: `${req.protocol}://${req.get('host')}/tour/${
    //   req.params.tourID
    // }`,
    success_url: `${req.protocol}://https://priceless-bhabha-ff52c8.netlify.app/myBookings`,
    cancel_url: `${req.protocol}://https://priceless-bhabha-ff52c8.netlify.app/tour/${req.params.tourID}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        //array of live images
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
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

const createBookingCheckout = async (session) => {
  const tour = session.client.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = Stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`webhook error :${err.message}`);
  }
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);
  res.send(200).json({ received: true });
};
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
