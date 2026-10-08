/**
 * Frontend form validation utilities
 * Provides client-side validation with regex patterns and error handling
 */

// Validation regex patterns
export const validationPatterns: Record<string, RegExp> = {
  // Name validation: letters, spaces, hyphens, apostrophes, periods
  name: /^[a-zA-Z\s\-',.]{2,50}$/,
  
  // University ID: alphanumeric, 3-20 characters
  universityId: /^[a-zA-Z0-9]{3,20}$/,
  
  // CricHeroes ID: alphanumeric and underscores, 3-30 characters
  cricHeroesId: /^[a-zA-Z0-9_]{3,30}$/,
  
  // Email validation
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Team name: alphanumeric, spaces, 3-50 characters
  teamName: /^[a-zA-Z0-9\s]{3,50}$/,
  
  // Captain code: alphanumeric, 4-20 characters
  captainCode: /^[a-zA-Z0-9]{4,20}$/,
  
  // Phone number: international format
  phone: /^[+]?[\d\s\-\(\)]{10,20}$/,
  
  // Password: strong password requirements
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
  
  // Player ID: alphanumeric and hyphens
  playerId: /^[a-zA-Z0-9\-]+$/,
  
  // Team ID: alphanumeric and hyphens
  teamId: /^[a-zA-Z0-9\-]+$/
};

// Validation error messages
export const validationMessages: Record<string, any> = {
  name: {
    required: 'Name is required',
    invalid: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods',
    minLength: 'Name must be at least 2 characters',
    maxLength: 'Name cannot exceed 50 characters'
  },
  universityId: {
    required: 'University ID is required',
    invalid: 'University ID can only contain letters and numbers',
    minLength: 'University ID must be at least 3 characters',
    maxLength: 'University ID cannot exceed 20 characters'
  },
  cricHeroesId: {
    required: 'CricHeroes ID is required',
    invalid: 'CricHeroes ID can only contain letters, numbers, and underscores',
    minLength: 'CricHeroes ID must be at least 3 characters',
    maxLength: 'CricHeroes ID cannot exceed 30 characters'
  },
  email: {
    required: 'Email is required',
    invalid: 'Please provide a valid email address',
    maxLength: 'Email cannot exceed 100 characters'
  },
  teamName: {
    required: 'Team name is required',
    invalid: 'Team name can only contain letters, numbers, and spaces',
    minLength: 'Team name must be at least 3 characters',
    maxLength: 'Team name cannot exceed 50 characters'
  },
  captainCode: {
    required: 'Captain code is required',
    invalid: 'Captain code can only contain letters and numbers',
    minLength: 'Captain code must be at least 4 characters',
    maxLength: 'Captain code cannot exceed 20 characters'
  },
  phone: {
    required: 'Phone number is required',
    invalid: 'Please provide a valid phone number',
    minLength: 'Phone number must be at least 10 digits',
    maxLength: 'Phone number cannot exceed 20 characters'
  },
  password: {
    required: 'Password is required',
    invalid: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    minLength: 'Password must be at least 8 characters',
    maxLength: 'Password cannot exceed 128 characters'
  }
};

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate a single field
 */
export const validateField = (
  fieldName: string,
  value: string,
  required: boolean = true
): string | null => {
  // Check if required and empty
  if (required && (!value || value.trim() === '')) {
    return validationMessages[fieldName]?.required || 'This field is required';
  }

  // Skip validation if not required and empty
  if (!required && (!value || value.trim() === '')) {
    return null;
  }

  const trimmedValue = value.trim();
  const pattern = validationPatterns[fieldName];

  if (!pattern) {
    return 'Validation pattern not found for this field';
  }

  // Test the pattern
  if (!pattern.test(trimmedValue)) {
    return validationMessages[fieldName]?.invalid || 'Invalid format';
  }

  // Check length constraints
  const messages = validationMessages[fieldName];
  if (messages?.minLength && trimmedValue.length < parseInt(messages.minLength.match(/\d+/)?.[0] || '0')) {
    return messages.minLength;
  }

  if (messages?.maxLength && trimmedValue.length > parseInt(messages.maxLength.match(/\d+/)?.[0] || '999')) {
    return messages.maxLength;
  }

  return null;
};

/**
 * Validate entire form object
 */
export const validateForm = (
  formData: Record<string, any>,
  requiredFields: string[] = []
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Validate each field in the form data
  Object.keys(formData).forEach(fieldName => {
    const isRequired = requiredFields.includes(fieldName);
    const error = validateField(fieldName, formData[fieldName], isRequired);
    
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  });

  // Check if all required fields are present
  requiredFields.forEach(fieldName => {
    if (!formData.hasOwnProperty(fieldName)) {
      errors[fieldName] = validationMessages[fieldName]?.required || 'This field is required';
      isValid = false;
    }
  });

  return {
    isValid,
    errors
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Sanitize form data object
 */
export const sanitizeFormData = (formData: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  Object.keys(formData).forEach(key => {
    if (typeof formData[key] === 'string') {
      sanitized[key] = sanitizeInput(formData[key]);
    } else {
      sanitized[key] = formData[key];
    }
  });
  
  return sanitized;
};

/**
 * Custom validation functions for specific use cases
 */
export const customValidators = {
  // Validate admin key format
  adminKey: (value: string): string | null => {
    if (!value || value.length < 8) {
      return 'Admin key must be at least 8 characters';
    }
    if (value.length > 100) {
      return 'Admin key cannot exceed 100 characters';
    }
    return null;
  },

  // Validate bid amount
  bidAmount: (value: string): string | null => {
    const amount = parseInt(value);
    if (isNaN(amount)) {
      return 'Bid amount must be a number';
    }
    if (amount < 100) {
      return 'Bid amount must be at least 100';
    }
    if (amount > 100000) {
      return 'Bid amount cannot exceed 100,000';
    }
    return null;
  },

  // Validate team budget
  teamBudget: (value: string): string | null => {
    const budget = parseInt(value);
    if (isNaN(budget)) {
      return 'Budget must be a number';
    }
    if (budget < 0) {
      return 'Budget cannot be negative';
    }
    if (budget > 10000000) {
      return 'Budget cannot exceed 10,000,000';
    }
    return null;
  },

  // Validate date range
  dateRange: (startDate: string, endDate: string): string | null => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid date format';
    }
    
    if (start >= end) {
      return 'Start date must be before end date';
    }
    
    return null;
  }
};

/**
 * Real-time validation for form inputs
 */
export const validateFieldRealTime = (
  fieldName: string,
  value: string,
  formData: Record<string, any>,
  requiredFields: string[] = []
): string | null => {
  // Check if field is required
  const isRequired = requiredFields.includes(fieldName);
  
  // Perform basic validation
  const basicError = validateField(fieldName, value, isRequired);
  if (basicError) return basicError;
  
  // Perform custom validation if applicable
  switch (fieldName) {
    case 'adminKey':
      return customValidators.adminKey(value);
    case 'bidAmount':
      return customValidators.bidAmount(value);
    case 'teamBudget':
      return customValidators.teamBudget(value);
    default:
      return null;
  }
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: Record<string, string>): string[] => {
  return Object.values(errors).filter(error => error && error.trim() !== '');
};

/**
 * Check if form has any errors
 */
export const hasFormErrors = (errors: Record<string, string>): boolean => {
  return Object.values(errors).some(error => error && error.trim() !== '');
};

export default {
  validationPatterns,
  validationMessages,
  validateField,
  validateForm,
  sanitizeInput,
  sanitizeFormData,
  customValidators,
  validateFieldRealTime,
  formatValidationErrors,
  hasFormErrors
};
