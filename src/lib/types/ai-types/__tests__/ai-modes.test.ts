/**
 * Tests for AI modes and operations types
 */

import { AIMode, ModificationType, AIPromptRequest, AIContinueRequest, AIModifyRequest } from '../ai-modes';

describe('AI Modes', () => {
  describe('AIMode enum', () => {
    test('should have correct enum values', () => {
      expect(AIMode.PROMPT).toBe('prompt');
      expect(AIMode.CONTINUE).toBe('continue');
      expect(AIMode.MODIFY).toBe('modify');
      expect(AIMode.NONE).toBe('none');
    });

    test('should contain all expected modes', () => {
      const expectedModes = ['prompt', 'continue', 'modify', 'none'];
      const actualModes = Object.values(AIMode);
      expect(actualModes).toEqual(expect.arrayContaining(expectedModes));
      expect(actualModes).toHaveLength(expectedModes.length);
    });
  });

  describe('ModificationType enum', () => {
    test('should have correct enum values', () => {
      expect(ModificationType.PROMPT).toBe('prompt');
      expect(ModificationType.EXPAND).toBe('expand');
      expect(ModificationType.SHORTEN).toBe('shorten');
      expect(ModificationType.REPHRASE).toBe('rephrase');
      expect(ModificationType.CORRECT).toBe('correct');
      expect(ModificationType.TONE).toBe('tone');
      expect(ModificationType.FORMAT).toBe('format');
      expect(ModificationType.REWRITE).toBe('rewrite');
      expect(ModificationType.SUMMARIZE).toBe('summarize');
      expect(ModificationType.IMPROVE_CLARITY).toBe('improve_clarity');
    });

    test('should contain all expected modification types', () => {
      const expectedTypes = [
        'prompt', 'expand', 'shorten', 'rephrase', 'correct',
        'tone', 'format', 'rewrite', 'summarize', 'improve_clarity'
      ];
      const actualTypes = Object.values(ModificationType);
      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).toHaveLength(expectedTypes.length);
    });
  });

  describe('Request interfaces', () => {
    test('AIPromptRequest should have required properties', () => {
      const mockRequest: AIPromptRequest = {
        prompt: 'Test prompt',
        documentContent: 'Test document content',
        cursorPosition: 100,
        conversationId: 'test-conversation-id',
        timestamp: Date.now()
      };

      expect(typeof mockRequest.prompt).toBe('string');
      expect(typeof mockRequest.documentContent).toBe('string');
      expect(typeof mockRequest.cursorPosition).toBe('number');
      expect(typeof mockRequest.conversationId).toBe('string');
      expect(typeof mockRequest.timestamp).toBe('number');
    });

    test('AIContinueRequest should have required properties', () => {
      const mockRequest: AIContinueRequest = {
        documentContent: 'Test document content',
        cursorPosition: 100,
        conversationId: 'test-conversation-id',
        timestamp: Date.now()
      };

      expect(typeof mockRequest.documentContent).toBe('string');
      expect(typeof mockRequest.cursorPosition).toBe('number');
      expect(typeof mockRequest.conversationId).toBe('string');
      expect(typeof mockRequest.timestamp).toBe('number');
    });

    test('AIContinueRequest should accept optional selectedText', () => {
      const mockRequest: AIContinueRequest = {
        documentContent: 'Test document content',
        cursorPosition: 100,
        selectedText: 'Selected text',
        conversationId: 'test-conversation-id',
        timestamp: Date.now()
      };

      expect(typeof mockRequest.selectedText).toBe('string');
    });

    test('AIModifyRequest should have required properties', () => {
      const mockRequest: AIModifyRequest = {
        selectedText: 'Text to modify',
        modificationType: ModificationType.REPHRASE,
        documentContent: 'Test document content',
        conversationId: 'test-conversation-id',
        timestamp: Date.now()
      };

      expect(typeof mockRequest.selectedText).toBe('string');
      expect(Object.values(ModificationType)).toContain(mockRequest.modificationType);
      expect(typeof mockRequest.documentContent).toBe('string');
      expect(typeof mockRequest.conversationId).toBe('string');
      expect(typeof mockRequest.timestamp).toBe('number');
    });

    test('AIModifyRequest should accept optional customPrompt', () => {
      const mockRequest: AIModifyRequest = {
        selectedText: 'Text to modify',
        modificationType: ModificationType.REPHRASE,
        documentContent: 'Test document content',
        conversationId: 'test-conversation-id',
        timestamp: Date.now(),
        customPrompt: 'Custom modification prompt'
      };

      expect(typeof mockRequest.customPrompt).toBe('string');
    });
  });
});
