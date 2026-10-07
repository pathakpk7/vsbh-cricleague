const xss = require('xss');

// XSS protection configuration
const xssOptions = {
  // Allow basic HTML tags for safe rendering
  whiteList: {
    a: ['href', 'title', 'target'],
    b: [],
    br: [],
    em: [],
    i: [],
    li: [],
    ol: [],
    p: [],
    strong: [],
    ul: [],
    span: ['class'],
    div: ['class']
  },
  // Strip script tags and their content
  onIgnoreTag: function(tag, html, options) {
    if (tag === 'script') {
      return '';
    }
    return '';
  },
  // Remove dangerous attributes
  onIgnoreTagAttr: function(tag, name, value, isWhiteAttr) {
    if (name === 'onclick' || name === 'onload' || name === 'onerror') {
      return '';
    }
  }
};

/**
 * Sanitize input to prevent XSS attacks
 * @param {string} input - Raw input string
 * @returns {string} - Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  return xss(input, xssOptions);
};

/**
 * Sanitize object recursively
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Express middleware for request sanitization
 */
const sanitizeRequest = (req, res, next) => {
  try {
    // Sanitize request body safely
    if (req.body && typeof req.body === 'object') {
      for (const key of Object.keys(req.body)) {
        req.body[key] = sanitizeObject(req.body[key]);
      }
    }
    
    // Sanitize query parameters safely without replacing getter reference
    if (req.query && typeof req.query === 'object') {
      for (const key of Object.keys(req.query)) {
        req.query[key] = sanitizeObject(req.query[key]);
      }
    }
    
    // Sanitize URL parameters safely without replacing getter reference
    if (req.params && typeof req.params === 'object') {
      for (const key of Object.keys(req.params)) {
        req.params[key] = sanitizeObject(req.params[key]);
      }
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input format'
    });
  }
};

/**
 * Custom sanitization for specific fields
 */
const customSanitizers = {
  // Sanitize names (allow only letters, spaces, and basic punctuation)
  name: (input) => {
    return input.replace(/[^a-zA-Z\s\-',.]/g, '').trim();
  },
  
  // Sanitize IDs (allow only alphanumeric and specific characters)
  id: (input) => {
    return input.replace(/[^a-zA-Z0-9\-_]/g, '').trim();
  },
  
  // Sanitize emails (basic email format cleaning)
  email: (input) => {
    return input.toLowerCase().replace(/[^a-z0-9@._\-]/g, '').trim();
  },
  
  // Sanitize numbers (remove non-numeric characters)
  number: (input) => {
    return input.replace(/[^0-9]/g, '');
  }
};

module.exports = {
  sanitizeInput,
  sanitizeObject,
  sanitizeRequest,
  customSanitizers
};
