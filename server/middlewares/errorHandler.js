/**
 * Centralized error handling middleware
 * Provides consistent error responses and logging
 */

// Custom error classes
class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
  }
}

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error details for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      statusCode = 400;
      break;
    case 'AuthenticationError':
      statusCode = 401;
      break;
    case 'AuthorizationError':
      statusCode = 403;
      break;
    case 'NotFoundError':
      statusCode = 404;
      break;
    case 'ConflictError':
      statusCode = 409;
      break;
    case 'RateLimitError':
      statusCode = 429;
      break;
    case 'DatabaseError':
      statusCode = 500;
      break;
    case 'SyntaxError':
      if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON format';
      }
      break;
    case 'CastError':
      statusCode = 400;
      message = 'Invalid data format';
      break;
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    statusCode = 503;
    message = 'Database connection error';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    errors = [];
  }

  // Send error response
  const errorResponse = {
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  };

  // Include validation errors if they exist
  if (errors.length > 0) {
    errorResponse.errors = errors;
  }

  // Include request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 * Eliminates need for try-catch blocks in controllers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
};

/**
 * Request ID middleware for tracking
 */
const requestId = (req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Development error handler (detailed errors)
 */
const developmentErrorHandler = (err, req, res, next) => {
  console.error('Development Error:', err);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    stack: err.stack,
    error: err,
    timestamp: new Date().toISOString()
  });
};

/**
 * Production error handler (safe errors)
 */
const productionErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  
  res.status(statusCode).json({
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  requestId,
  developmentErrorHandler,
  productionErrorHandler,
  // Custom error classes
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError
};
