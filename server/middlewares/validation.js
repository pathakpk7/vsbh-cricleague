const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      convert: true // Convert types automatically
    });

    if (error) {
      // Format validation errors for user-friendly response
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }

    // Replace the request property with validated and sanitized data
    req[source] = value;
    next();
  };
};

/**
 * Custom validation helpers
 */
const customValidators = {
  // Validate strong password
  strongPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 128 characters'
    }),

  // Validate phone number
  phoneNumber: Joi.string()
    .pattern(/^[+]?[\d\s\-\(\)]+$/)
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),

  // Validate URL
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Please provide a valid URL'
    }),

  // Validate alphanumeric with spaces
  alphanumericWithSpaces: Joi.string()
    .pattern(/^[a-zA-Z0-9\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Only letters, numbers, and spaces are allowed'
    }),

  // Validate positive numbers
  positiveNumber: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Value must be positive',
      'any.required': 'This field is required'
    }),

  // Validate date range
  dateRange: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required()
  }).messages({
    'date.min': 'End date must be after start date'
  }),

  // Validate pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * Common validation schemas
 */
const commonSchemas = {
  // ID validation
  id: Joi.string()
    .pattern(/^[a-zA-Z0-9\-_]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    }),

  // Email validation
  email: Joi.string()
    .email()
    .max(100)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 100 characters',
      'any.required': 'Email is required'
    }),

  // Name validation
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s\-',.]+$/)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'string.pattern.base': 'Name can only contain letters, spaces, and basic punctuation',
      'any.required': 'Name is required'
    }),

  // Optional description validation
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    })
};

module.exports = {
  validate,
  customValidators,
  commonSchemas
};
