// src/worker/middleware/validation-middleware.ts
// Request validation middleware for API routes
// Part of modular refactor (see code-modularization-refactor spec)

import type { Context } from '../types';

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export class ValidationMiddleware {
  /**
   * Validates request body against a set of rules
   */
  static validateRequestBody(body: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const sanitizedData: any = {};

    // Check if body exists
    if (!body && rules.some(rule => rule.required)) {
      return {
        isValid: false,
        errors: ['Request body is required']
      };
    }

    for (const rule of rules) {
      const value = body?.[rule.field];
      const fieldErrors = this.validateField(rule.field, value, rule);
      
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else {
        // Add sanitized value
        sanitizedData[rule.field] = this.sanitizeValue(value, rule.type);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  /**
   * Validates a single field against a rule
   */
  private static validateField(fieldName: string, value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`Field '${fieldName}' is required`);
      return errors;
    }

    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null)) {
      return errors;
    }

    // Check empty string if allowEmpty is false
    if (rule.type === 'string' && !rule.allowEmpty && value === '') {
      errors.push(`Field '${fieldName}' cannot be empty`);
      return errors;
    }

    // Type validation
    const typeError = this.validateType(fieldName, value, rule.type);
    if (typeError) {
      errors.push(typeError);
      return errors;
    }

    // Length validation for strings
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Field '${fieldName}' must be at least ${rule.minLength} characters long`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Field '${fieldName}' must be no more than ${rule.maxLength} characters long`);
      }
    }

    // Pattern validation for strings
    if (rule.pattern && rule.type === 'string' && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push(`Field '${fieldName}' does not match the required pattern`);
      }
    }

    // Array validation
    if (rule.type === 'array' && Array.isArray(value)) {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`Field '${fieldName}' must have at least ${rule.minLength} items`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`Field '${fieldName}' must have no more than ${rule.maxLength} items`);
      }
    }

    return errors;
  }

  /**
   * Validates the type of a value
   */
  private static validateType(fieldName: string, value: any, expectedType: ValidationRule['type']): string | null {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return `Field '${fieldName}' must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Field '${fieldName}' must be a valid number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Field '${fieldName}' must be a boolean`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          return `Field '${fieldName}' must be an array`;
        }
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `Field '${fieldName}' must be an object`;
        }
        break;
    }
    return null;
  }

  /**
   * Sanitizes a value based on its type
   */
  private static sanitizeValue(value: any, type: ValidationRule['type']): any {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? value.trim() : value;
      case 'number':
        return typeof value === 'number' ? value : parseFloat(value);
      default:
        return value;
    }
  }

  /**
   * Middleware function for search endpoints
   */
  static validateSearchRequest(ctx: Context): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'query', type: 'string', required: true, minLength: 1, maxLength: 1000 },
      { field: 'conversationId', type: 'string', required: true, minLength: 1 },
      { field: 'filters', type: 'object', required: false },
      { field: 'options', type: 'object', required: false }
    ];

    return this.validateRequestBody(ctx.request?.body, rules);
  }

  /**
   * Middleware function for query generation endpoints
   */
  static validateQueryRequest(ctx: Context): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'conversationId', type: 'string', required: true, minLength: 1 },
      { field: 'prompt', type: 'string', required: false, maxLength: 2000 },
      { field: 'query', type: 'string', required: false, maxLength: 1000 },
      { field: 'queries', type: 'array', required: false, minLength: 1, maxLength: 10 },
      { field: 'context', type: 'object', required: false },
      { field: 'options', type: 'object', required: false }
    ];

    return this.validateRequestBody(ctx.request?.body, rules);
  }

  /**
   * Middleware function for analytics endpoints
   */
  static validateAnalyticsRequest(ctx: Context): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'eventType', type: 'string', required: false, minLength: 1 },
      { field: 'eventData', type: 'object', required: false },
      { field: 'metricType', type: 'string', required: false },
      { field: 'reportType', type: 'string', required: false },
      { field: 'timeRange', type: 'object', required: false },
      { field: 'filters', type: 'object', required: false }
    ];

    return this.validateRequestBody(ctx.request?.body, rules);
  }

  /**
   * Middleware function for history endpoints
   */
  static validateHistoryRequest(ctx: Context): ValidationResult {
    const rules: ValidationRule[] = [
      { field: 'conversationId', type: 'string', required: false, minLength: 1 },
      { field: 'query', type: 'string', required: false, minLength: 1 },
      { field: 'data', type: 'object', required: false },
      { field: 'entryId', type: 'string', required: false },
      { field: 'limit', type: 'number', required: false },
      { field: 'offset', type: 'number', required: false },
      { field: 'filters', type: 'object', required: false }
    ];

    return this.validateRequestBody(ctx.request?.body, rules);
  }
}
