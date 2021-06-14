//returns function to be called later
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next); //calling next to ignit the global error handler
};
