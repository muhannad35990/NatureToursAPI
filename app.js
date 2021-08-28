const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRouter');
const reviewsRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

const app = express();

//MIDDLEWARE
//set security http headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//define how many req by Ip allowed by certin amount of time
const limiter = rateLimit({
  max: 500, //allow 100 req by hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP please try again in an hour!',
});
app.use('/api', limiter); //apply to urls start with api

//allow cors on browser
// app.use(cors());
// app.options('*', cors()); // for complex requests
const corsOptions = {
  origin: '*',
  credentials: true,
};

app.use(cors(corsOptions));
//web hook body should read as raw so we put it before the json middleware that convert the body to json
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//body parser,reading data from body into req.body
app.use(
  express.json({
    limit: '10kb', //limit body size to 10kb
  })
);

//data sanitization against NOSQL query injection
app.use(mongoSanitize());

//data sanitization against XSS. clean any malicious⁯ code
app.use(xss());

//http parameter polution. prevent parameter polution.
//remove any repeatation in the paramerter and except some of them in the whitelist
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//serving static files
app.use(express.static(`${__dirname}/public`));

//compress all text sent to the client
app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date();
  next();
});

///ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingRouter);

//for all other routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
//ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);
module.exports = app;
