/**
 * Custom validation middleware
 * Simple validation helpers without external dependencies
 */

// Custom error class for validation errors
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.name = 'ValidationError';
  }
}

// Validation helper functions
const validate = {
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  },

  string: (value, fieldName) => {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ValidationError(`${fieldName} must be a non-empty string`);
    }
  },

  number: (value, fieldName, min = -Infinity) => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a number`);
    }
    if (value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
  },

  inArray: (value, allowed, fieldName) => {
    if (!allowed.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${allowed.join(', ')}`);
    }
  },

  array: (value, fieldName) => {
    if (!Array.isArray(value) || value.length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty array`);
    }
  }
};

module.exports = { validate, ValidationError };
