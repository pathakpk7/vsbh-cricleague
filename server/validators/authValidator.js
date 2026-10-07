const Joi = require('joi');

// Validation schemas for authentication endpoints
const authSchemas = {
  // Login validation schema
  login: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'string.pattern.base': 'Name can only contain letters and spaces',
        'any.required': 'Name is required'
      }),
    
    universityId: Joi.string()
      .trim()
      .min(3)
      .max(20)
      .pattern(/^[a-zA-Z0-9]+$/)
      .required()
      .messages({
        'string.empty': 'University ID is required',
        'string.min': 'University ID must be at least 3 characters',
        'string.max': 'University ID cannot exceed 20 characters',
        'string.pattern.base': 'University ID can only contain letters and numbers',
        'any.required': 'University ID is required'
      }),
    
    cricHeroesId: Joi.string()
      .trim()
      .min(3)
      .max(30)
      .pattern(/^[a-zA-Z0-9_]+$/)
      .required()
      .messages({
        'string.empty': 'CricHeroes ID is required',
        'string.min': 'CricHeroes ID must be at least 3 characters',
        'string.max': 'CricHeroes ID cannot exceed 30 characters',
        'string.pattern.base': 'CricHeroes ID can only contain letters, numbers, and underscores',
        'any.required': 'CricHeroes ID is required'
      }),
    
    email: Joi.string()
      .trim()
      .email()
      .max(100)
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email cannot exceed 100 characters',
        'any.required': 'Email is required'
      })
  }),

  // Admin login validation schema
  adminLogin: Joi.object({
    admin_key: Joi.string()
      .trim()
      .min(8)
      .max(100)
      .required()
      .messages({
        'string.empty': 'Admin key is required',
        'string.min': 'Admin key must be at least 8 characters',
        'string.max': 'Admin key cannot exceed 100 characters',
        'any.required': 'Admin key is required'
      })
  }),

  // Team creation validation schema
  teamCreation: Joi.object({
    teamName: Joi.string()
      .trim()
      .min(3)
      .max(50)
      .pattern(/^[a-zA-Z0-9\s]+$/)
      .required()
      .messages({
        'string.empty': 'Team name is required',
        'string.min': 'Team name must be at least 3 characters',
        'string.max': 'Team name cannot exceed 50 characters',
        'string.pattern.base': 'Team name can only contain letters, numbers, and spaces',
        'any.required': 'Team name is required'
      }),
    
    captainCode: Joi.string()
      .trim()
      .min(4)
      .max(20)
      .pattern(/^[a-zA-Z0-9]+$/)
      .required()
      .messages({
        'string.empty': 'Captain code is required',
        'string.min': 'Captain code must be at least 4 characters',
        'string.max': 'Captain code cannot exceed 20 characters',
        'string.pattern.base': 'Captain code can only contain letters and numbers',
        'any.required': 'Captain code is required'
      }),
    
    captainName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.empty': 'Captain name is required',
        'string.min': 'Captain name must be at least 2 characters',
        'string.max': 'Captain name cannot exceed 50 characters',
        'string.pattern.base': 'Captain name can only contain letters and spaces',
        'any.required': 'Captain name is required'
      })
  }),

  // Player bid validation schema
  playerBid: Joi.object({
    playerId: Joi.string()
      .trim()
      .pattern(/^[a-zA-Z0-9-]+$/)
      .required()
      .messages({
        'string.empty': 'Player ID is required',
        'string.pattern.base': 'Invalid player ID format',
        'any.required': 'Player ID is required'
      }),
    
    bidAmount: Joi.number()
      .integer()
      .min(100)
      .max(100000)
      .required()
      .messages({
        'number.empty': 'Bid amount is required',
        'number.min': 'Bid amount must be at least 100',
        'number.max': 'Bid amount cannot exceed 100000',
        'any.required': 'Bid amount is required'
      }),
    
    teamId: Joi.string()
      .trim()
      .pattern(/^[a-zA-Z0-9-]+$/)
      .required()
      .messages({
        'string.empty': 'Team ID is required',
        'string.pattern.base': 'Invalid team ID format',
        'any.required': 'Team ID is required'
      })
  })
};

module.exports = authSchemas;
