/**
 * Tests for citation styles and formats
 */

import { CitationStyle, CitationFormat, CitationRequest, CitationResponse } from '../citation-styles';

describe('Citation Styles', () => {
  describe('CitationStyle enum', () => {
    test('should have correct enum values', () => {
      expect(CitationStyle.APA).toBe('apa');
      expect(CitationStyle.MLA).toBe('mla');
      expect(CitationStyle.CHICAGO).toBe('chicago');
      expect(CitationStyle.HARVARD).toBe('harvard');
      expect(CitationStyle.IEEE).toBe('ieee');
      expect(CitationStyle.VANCOUVER).toBe('vancouver');
    });

    test('should contain all expected citation styles', () => {
      const expectedStyles = ['apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver'];
      const actualStyles = Object.values(CitationStyle);
      expect(actualStyles).toEqual(expect.arrayContaining(expectedStyles));
      expect(actualStyles).toHaveLength(expectedStyles.length);
    });
  });

  describe('CitationFormat interface', () => {
    test('should accept valid citation format', () => {
      const mockFormat: CitationFormat = {
        style: 'APA',
        detected: true,
        examples: ['(Smith, 2023)', 'Smith, J. (2023)']
      };

      expect(typeof mockFormat.style).toBe('string');
      expect(typeof mockFormat.detected).toBe('boolean');
      expect(Array.isArray(mockFormat.examples)).toBe(true);
    });

    test('should handle unknown style', () => {
      const mockFormat: CitationFormat = {
        style: 'Unknown',
        detected: false,
        examples: []
      };

      expect(mockFormat.style).toBe('Unknown');
      expect(mockFormat.detected).toBe(false);
      expect(mockFormat.examples).toHaveLength(0);
    });
  });

  describe('CitationRequest interface', () => {
    test('should have required properties', () => {
      const mockRequest: CitationRequest = {
        referenceId: 'ref-123',
        style: CitationStyle.APA,
        type: 'inline'
      };

      expect(typeof mockRequest.referenceId).toBe('string');
      expect(Object.values(CitationStyle)).toContain(mockRequest.style);
      expect(['inline', 'bibliography']).toContain(mockRequest.type);
    });

    test('should accept optional context', () => {
      const mockRequest: CitationRequest = {
        referenceId: 'ref-123',
        style: CitationStyle.MLA,
        type: 'bibliography',
        context: 'This is used in the conclusion section'
      };

      expect(typeof mockRequest.context).toBe('string');
    });
  });

  describe('CitationResponse interface', () => {
    test('should handle successful response', () => {
      const mockResponse: CitationResponse = {
        success: true,
        citation: 'Smith, J. (2023). Test Article. Journal of Testing, 1(1), 1-10.',
        style: CitationStyle.APA,
        type: 'bibliography'
      };

      expect(mockResponse.success).toBe(true);
      expect(typeof mockResponse.citation).toBe('string');
      expect(Object.values(CitationStyle)).toContain(mockResponse.style);
      expect(['inline', 'bibliography']).toContain(mockResponse.type);
    });

    test('should handle error response', () => {
      const mockResponse: CitationResponse = {
        success: false,
        style: CitationStyle.APA,
        type: 'inline',
        error: 'Reference not found'
      };

      expect(mockResponse.success).toBe(false);
      expect(typeof mockResponse.error).toBe('string');
      expect(mockResponse.citation).toBeUndefined();
    });
  });
});
