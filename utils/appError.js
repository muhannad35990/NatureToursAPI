class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //call parent Error constructor with the message
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; //fail or error ,check if start with 4 to indicate to fail
    this.isOperational = true; //to detect unexpected errors that not handled in this class
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
