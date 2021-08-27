const mongoose = require('mongoose');
const dotenv = require('dotenv');

//catching uncaught exceptions to listen at the begining to the whole app
process.on('uncaughtException', (err) => {
  console.log(err);
  console.log(err.name, err.message);
  console.log('uncaught Rejection!💥 Shutting down ...');
  process.exit(1);
});

const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  });

const server = app.listen(process.env.PORT || 3000, () =>
  console.log('server started on port 3000')
);

//handle unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log(err);
  console.log('Unhandled Rejection!💥 Shutting down ...');

  //give the server time to finish all requests
  server.close(() => {
    process.exit(1); //1 for error , 0 for success
  });
});
