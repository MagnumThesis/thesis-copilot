// src/worker/middleware/__tests__/validation-middleware.test.ts
// Unit tests for validation middleware

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationMiddleware, ValidationRule } from '../validation-middleware';
import type { Context } from '../../types';

describe('ValidationMiddleware', () => {
  const createMockContext = (body: any): Context => ({
    request: { body }
  });

  describe('validateRequestBody', () => {
    it('should validate required string fields', () => {
      const rules: ValidationRule[] = [
        { field: 'name', type: 'string', required: true },
        { field: 'email', type: 'string', required: true }
      ];

      const validData = { name: 'John', email: 'john@example.com' };
      const result = ValidationMiddleware.validateRequestBody(validData, rules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedData).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should fail validation for missing required fields', () => {
      const rules: ValidationRule[] = [
        { field: 'name', type: 'string', required: true },
        { field: 'email', type: 'string', required: true }
      ];

      const invalidData = { name: 'John' }; // missing email
      const result = ValidationMiddleware.validateRequestBody(invalidData, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'email' is required");
      expect(result.sanitizedData).toBeUndefined();
    });

    it('should validate string length constraints', () => {
      const rules: ValidationRule[] = [
        { field: 'username', type: 'string', required: true, minLength: 3, maxLength: 10 }
      ];

      // Too short
      const shortResult = ValidationMiddleware.validateRequestBody({ username: 'ab' }, rules);
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors).toContain("Field 'username' must be at least 3 characters long");

      // Too long
      const longResult = ValidationMiddleware.validateRequestBody({ username: 'verylongusername' }, rules);
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors).toContain("Field 'username' must be no more than 10 characters long");

      // Valid length
      const validResult = ValidationMiddleware.validateRequestBody({ username: 'validuser' }, rules);
      expect(validResult.isValid).toBe(true);
    });

    it('should validate different data types', () => {
      const rules: ValidationRule[] = [
        { field: 'count', type: 'number', required: true },
        { field: 'active', type: 'boolean', required: true },
        { field: 'tags', type: 'array', required: true },
        { field: 'config', type: 'object', required: true }
      ];

      const validData = {
        count: 42,
        active: true,
        tags: ['tag1', 'tag2'],
        config: { setting: 'value' }
      };

      const result = ValidationMiddleware.validateRequestBody(validData, rules);
      expect(result.isValid).toBe(true);

      // Invalid types
      const invalidData = {
        count: 'not-a-number',
        active: 'not-a-boolean',
        tags: 'not-an-array',
        config: 'not-an-object'
      };

      const invalidResult = ValidationMiddleware.validateRequestBody(invalidData, rules);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain("Field 'count' must be a valid number");
      expect(invalidResult.errors).toContain("Field 'active' must be a boolean");
      expect(invalidResult.errors).toContain("Field 'tags' must be an array");
      expect(invalidResult.errors).toContain("Field 'config' must be an object");
    });

    it('should validate pattern matching', () => {
      const rules: ValidationRule[] = [
        { field: 'email', type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
      ];

      const validResult = ValidationMiddleware.validateRequestBody({ email: 'test@example.com' }, rules);
      expect(validResult.isValid).toBe(true);

      const invalidResult = ValidationMiddleware.validateRequestBody({ email: 'invalid-email' }, rules);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain("Field 'email' does not match the required pattern");
    });

    it('should handle optional fields', () => {
      const rules: ValidationRule[] = [
        { field: 'name', type: 'string', required: true },
        { field: 'description', type: 'string', required: false }
      ];

      const dataWithoutOptional = { name: 'John' };
      const result = ValidationMiddleware.validateRequestBody(dataWithoutOptional, rules);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData).toEqual({ name: 'John' });

      const dataWithOptional = { name: 'John', description: 'A person' };
      const result2 = ValidationMiddleware.validateRequestBody(dataWithOptional, rules);
      expect(result2.isValid).toBe(true);
      expect(result2.sanitizedData).toEqual({ name: 'John', description: 'A person' });
    });

    it('should sanitize string values by trimming whitespace', () => {
      const rules: ValidationRule[] = [
        { field: 'name', type: 'string', required: true }
      ];

      const dataWithWhitespace = { name: '  John Doe  ' };
      const result = ValidationMiddleware.validateRequestBody(dataWithWhitespace, rules);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedData?.name).toBe('John Doe');
    });
  });

  describe('validateSearchRequest', () => {
    it('should validate search request correctly', () => {
      const validCtx = createMockContext({
        query: 'machine learning',
        conversationId: 'conv-123',
        filters: { year: 2023 },
        options: { maxResults: 10 }
      });

      const result = ValidationMiddleware.validateSearchRequest(validCtx);
      expect(result.isValid).toBe(true);
    });

    it('should fail for missing required search fields', () => {
      const invalidCtx = createMockContext({
        conversationId: 'conv-123'
        // missing query
      });

      const result = ValidationMiddleware.validateSearchRequest(invalidCtx);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'query' is required");
    });

    it('should fail for empty query', () => {
      const invalidCtx = createMockContext({
        query: '',
        conversationId: 'conv-123'
      });

      const result = ValidationMiddleware.validateSearchRequest(invalidCtx);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'query' cannot be empty");
    });
  });

  describe('validateQueryRequest', () => {
    it('should validate query generation request', () => {
      const validCtx = createMockContext({
        conversationId: 'conv-123',
        prompt: 'Find papers about neural networks',
        context: { domain: 'AI' }
      });

      const result = ValidationMiddleware.validateQueryRequest(validCtx);
      expect(result.isValid).toBe(true);
    });

    it('should validate query combination request', () => {
      const validCtx = createMockContext({
        conversationId: 'conv-456',
        queries: ['query1', 'query2', 'query3']
      });

      const result = ValidationMiddleware.validateQueryRequest(validCtx);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAnalyticsRequest', () => {
    it('should validate event tracking request', () => {
      const validCtx = createMockContext({
        eventType: 'search_performed',
        eventData: { query: 'test', results: 5 }
      });

      const result = ValidationMiddleware.validateAnalyticsRequest(validCtx);
      expect(result.isValid).toBe(true);
    });

    it('should validate metrics request', () => {
      const validCtx = createMockContext({
        metricType: 'usage_stats',
        timeRange: { start: '2023-01-01', end: '2023-01-31' }
      });

      const result = ValidationMiddleware.validateAnalyticsRequest(validCtx);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateHistoryRequest', () => {
    it('should validate history retrieval request', () => {
      const validCtx = createMockContext({
        conversationId: 'conv-789',
        limit: 10,
        offset: 0
      });

      const result = ValidationMiddleware.validateHistoryRequest(validCtx);
      expect(result.isValid).toBe(true);
    });

    it('should validate history search request', () => {
      const validCtx = createMockContext({
        query: 'search term',
        filters: { dateRange: 'week' }
      });

      const result = ValidationMiddleware.validateHistoryRequest(validCtx);
      expect(result.isValid).toBe(true);
    });
  });
});
