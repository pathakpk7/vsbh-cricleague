const logger = require('./logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400);
    this.field = field;
    this.name = 'ValidationError';
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Supabase error handling
  if (err.code === 'PGRST116') {
    error = new NotFoundError('Database record');
  }

  // Validation error
  if (err.name === 'ValidationError') {
    error = new AppError(err.message, 400);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Cast error (Mongoose)
  if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  }

  // Duplicate key error
  if (err.code === 11000) {
    error = new AppError('Duplicate field value', 400);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  catchAsync,
  errorHandler,
  notFound
};
