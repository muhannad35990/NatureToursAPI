const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRouter');

const app = express();

//MIDDLEWARE
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//define how many req by Ip allowed by certin amount of time
const limiter = rateLimit({
  max: 100, //allow 100 req by hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP please try again in an hour!',
});
app.use('/api', limiter); //apply to urls start with api
app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  req.requestTime = new Date();
  next();
});

///ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//for all other routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
//ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);
module.exports = app;
