const errorHandler = (err, req, res, next) => {
  let status  = err.statusCode || 500;
  let message = err.message || 'Server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    status  = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    status  = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') { status = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { status = 401; message = 'Token expired'; }

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(status).json({ message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
};

module.exports = errorHandler;
