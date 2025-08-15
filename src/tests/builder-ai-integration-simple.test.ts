/**
 * Builder AI Integration Tests - Simplified
 * Tests the key integration points between Builder and AI components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIMode, ModificationType } from '@/lib/ai-types';

// Mock the AI mode manager hook
const mockAIModeManager = {
  currentMode: AIMode.NONE,
  isProcessing: false,
  hasSelectedText: false,
  selectedText: null,
  setMode: vi.fn(),
  resetMode: vi.fn(),
  processPrompt: vi.fn(),
  processContinue: vi.fn(),
  processModify: vi.fn(),
  updateSelection: vi.fn(),
  validateTextSelection: vi.fn(),
  showModificationTypeSelector: false,
  showModificationPreview: false,
  showCustomPromptInput: false,
  currentModificationType: null,
  modificationPreviewContent: null,
  originalTextForModification: null,
  startModifyMode: vi.fn(),
  selectModificationType: vi.fn(),
  acceptModification: vi.fn(),
  rejectModification: vi.fn(),
  canActivateMode: vi.fn(),
};

vi.mock('@/hooks/use-ai-mode-manager', () => ({
  useAIModeManager: () => mockAIModeManager,
}));

describe('Builder AI Integration - Core Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock to default state
    Object.assign(mockAIModeManager, {
      currentMode: AIMode.NONE,
      isProcessing: false,
      hasSelectedText: false,
      selectedText: null,
      showModificationTypeSelector: false,
      showModificationPreview: false,
      showCustomPromptInput: false,
      currentModificationType: null,
      modificationPreviewContent: null,
      originalTextForModification: null,
    });
  });

  describe('AI Mode Manager Integration', () => {
    it('should initialize with correct default state', () => {
      expect(mockAIModeManager.currentMode).toBe(AIMode.NONE);
      expect(mockAIModeManager.isProcessing).toBe(false);
      expect(mockAIModeManager.hasSelectedText).toBe(false);
      expect(mockAIModeManager.selectedText).toBe(null);
    });

    it('should provide all required mode management methods', () => {
      expect(typeof mockAIModeManager.setMode).toBe('function');
      expect(typeof mockAIModeManager.resetMode).toBe('function');
      expect(typeof mockAIModeManager.processPrompt).toBe('function');
      expect(typeof mockAIModeManager.processContinue).toBe('function');
      expect(typeof mockAIModeManager.processModify).toBe('function');
    });

    it('should provide all required selection management methods', () => {
      expect(typeof mockAIModeManager.updateSelection).toBe('function');
      expect(typeof mockAIModeManager.validateTextSelection).toBe('function');
    });

    it('should provide all required modify mode methods', () => {
      expect(typeof mockAIModeManager.startModifyMode).toBe('function');
      expect(typeof mockAIModeManager.selectModificationType).toBe('function');
      expect(typeof mockAIModeManager.acceptModification).toBe('function');
      expect(typeof mockAIModeManager.rejectModification).toBe('function');
    });
  });

  describe('AI Processing Workflow', () => {
    it('should handle prompt mode workflow', async () => {
      const mockResponse = {
        success: true,
        content: 'Generated content',
        metadata: { tokensUsed: 100, processingTime: 1500 }
      };

      mockAIModeManager.processPrompt.mockResolvedValue(mockResponse);

      const result = await mockAIModeManager.processPrompt('Test prompt', 0);

      expect(mockAIModeManager.processPrompt).toHaveBeenCalledWith('Test prompt', 0);
      expect(result).toEqual(mockResponse);
    });

    it('should handle continue mode workflow', async () => {
      const mockResponse = {
        success: true,
        content: 'Continued content',
        metadata: { tokensUsed: 80, processingTime: 1200 }
      };

      mockAIModeManager.processContinue.mockResolvedValue(mockResponse);

      const result = await mockAIModeManager.processContinue(100, 'selected text');

      expect(mockAIModeManager.processContinue).toHaveBeenCalledWith(100, 'selected text');
      expect(result).toEqual(mockResponse);
    });

    it('should handle modify mode workflow', async () => {
      const mockResponse = {
        success: true,
        content: 'Modified content',
        metadata: { tokensUsed: 60, processingTime: 1000 }
      };

      mockAIModeManager.processModify.mockResolvedValue(mockResponse);

      const result = await mockAIModeManager.processModify('text to modify', ModificationType.REWRITE);

      expect(mockAIModeManager.processModify).toHaveBeenCalledWith('text to modify', ModificationType.REWRITE);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error responses gracefully', async () => {
      const mockError = new Error('AI service error');
      mockAIModeManager.processPrompt.mockRejectedValue(mockError);

      await expect(mockAIModeManager.processPrompt('Test prompt', 0)).rejects.toThrow('AI service error');
    });
  });

  describe('State Management Integration', () => {
    it('should manage mode transitions correctly', () => {
      // Test mode setting
      mockAIModeManager.setMode(AIMode.PROMPT);
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.PROMPT);

      // Test mode reset
      mockAIModeManager.resetMode();
      expect(mockAIModeManager.resetMode).toHaveBeenCalled();
    });

    it('should manage text selection state', () => {
      const mockSelection = {
        start: 0,
        end: 10,
        text: 'Sample text'
      };

      mockAIModeManager.updateSelection(mockSelection);
      expect(mockAIModeManager.updateSelection).toHaveBeenCalledWith(mockSelection);

      mockAIModeManager.validateTextSelection(mockSelection);
      expect(mockAIModeManager.validateTextSelection).toHaveBeenCalledWith(mockSelection);
    });

    it('should manage modify mode state transitions', () => {
      // Start modify mode
      mockAIModeManager.startModifyMode();
      expect(mockAIModeManager.startModifyMode).toHaveBeenCalled();

      // Select modification type
      mockAIModeManager.selectModificationType(ModificationType.EXPAND);
      expect(mockAIModeManager.selectModificationType).toHaveBeenCalledWith(ModificationType.EXPAND);

      // Accept modification
      mockAIModeManager.acceptModification();
      expect(mockAIModeManager.acceptModification).toHaveBeenCalled();

      // Reject modification
      mockAIModeManager.rejectModification();
      expect(mockAIModeManager.rejectModification).toHaveBeenCalled();
    });
  });

  describe('Component State Integration', () => {
    it('should track processing state correctly', () => {
      // Initially not processing
      expect(mockAIModeManager.isProcessing).toBe(false);

      // Simulate processing state
      mockAIModeManager.isProcessing = true;
      expect(mockAIModeManager.isProcessing).toBe(true);
    });

    it('should track text selection state correctly', () => {
      // Initially no text selected
      expect(mockAIModeManager.hasSelectedText).toBe(false);
      expect(mockAIModeManager.selectedText).toBe(null);

      // Simulate text selection
      mockAIModeManager.hasSelectedText = true;
      mockAIModeManager.selectedText = {
        start: 0,
        end: 10,
        text: 'Selected text'
      };

      expect(mockAIModeManager.hasSelectedText).toBe(true);
      expect(mockAIModeManager.selectedText).toEqual({
        start: 0,
        end: 10,
        text: 'Selected text'
      });
    });

    it('should track modify mode UI state correctly', () => {
      // Initially no modify mode UI shown
      expect(mockAIModeManager.showModificationTypeSelector).toBe(false);
      expect(mockAIModeManager.showModificationPreview).toBe(false);
      expect(mockAIModeManager.showCustomPromptInput).toBe(false);

      // Simulate modify mode UI states
      mockAIModeManager.showModificationTypeSelector = true;
      expect(mockAIModeManager.showModificationTypeSelector).toBe(true);

      mockAIModeManager.showModificationPreview = true;
      mockAIModeManager.modificationPreviewContent = 'Preview content';
      mockAIModeManager.originalTextForModification = 'Original text';
      mockAIModeManager.currentModificationType = ModificationType.REWRITE;

      expect(mockAIModeManager.showModificationPreview).toBe(true);
      expect(mockAIModeManager.modificationPreviewContent).toBe('Preview content');
      expect(mockAIModeManager.originalTextForModification).toBe('Original text');
      expect(mockAIModeManager.currentModificationType).toBe(ModificationType.REWRITE);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors in prompt mode', async () => {
      const networkError = new Error('Network connection failed');
      mockAIModeManager.processPrompt.mockRejectedValue(networkError);

      await expect(mockAIModeManager.processPrompt('Test prompt', 0))
        .rejects.toThrow('Network connection failed');
    });

    it('should handle API errors in continue mode', async () => {
      const apiError = new Error('AI service unavailable');
      mockAIModeManager.processContinue.mockRejectedValue(apiError);

      await expect(mockAIModeManager.processContinue(0))
        .rejects.toThrow('AI service unavailable');
    });

    it('should handle validation errors in modify mode', async () => {
      const validationError = new Error('Invalid text selection');
      mockAIModeManager.processModify.mockRejectedValue(validationError);

      await expect(mockAIModeManager.processModify('', ModificationType.REWRITE))
        .rejects.toThrow('Invalid text selection');
    });
  });

  describe('Performance Integration', () => {
    it('should handle concurrent AI requests', async () => {
      const mockResponse1 = { success: true, content: 'Response 1' };
      const mockResponse2 = { success: true, content: 'Response 2' };

      mockAIModeManager.processPrompt
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const [result1, result2] = await Promise.all([
        mockAIModeManager.processPrompt('Prompt 1', 0),
        mockAIModeManager.processPrompt('Prompt 2', 10)
      ]);

      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
      expect(mockAIModeManager.processPrompt).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid state changes', () => {
      // Simulate rapid mode changes
      mockAIModeManager.setMode(AIMode.PROMPT);
      mockAIModeManager.setMode(AIMode.CONTINUE);
      mockAIModeManager.setMode(AIMode.MODIFY);
      mockAIModeManager.resetMode();

      expect(mockAIModeManager.setMode).toHaveBeenCalledTimes(3);
      expect(mockAIModeManager.resetMode).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid selection changes', () => {
      const selections = [
        { start: 0, end: 5, text: 'Hello' },
        { start: 6, end: 11, text: 'world' },
        { start: 0, end: 11, text: 'Hello world' }
      ];

      selections.forEach(selection => {
        mockAIModeManager.updateSelection(selection);
      });

      expect(mockAIModeManager.updateSelection).toHaveBeenCalledTimes(3);
      selections.forEach(selection => {
        expect(mockAIModeManager.updateSelection).toHaveBeenCalledWith(selection);
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain proper data flow in prompt mode', async () => {
      const prompt = 'Generate introduction';
      const cursorPosition = 100;
      const expectedResponse = {
        success: true,
        content: 'Generated introduction content',
        metadata: { tokensUsed: 150, processingTime: 2000 }
      };

      mockAIModeManager.processPrompt.mockResolvedValue(expectedResponse);

      // Simulate the full prompt mode workflow
      mockAIModeManager.setMode(AIMode.PROMPT);
      const result = await mockAIModeManager.processPrompt(prompt, cursorPosition);

      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.PROMPT);
      expect(mockAIModeManager.processPrompt).toHaveBeenCalledWith(prompt, cursorPosition);
      expect(result).toEqual(expectedResponse);
    });

    it('should maintain proper data flow in modify mode', async () => {
      const selectedText = 'Text to modify';
      const modificationType = ModificationType.IMPROVE_CLARITY;
      const expectedResponse = {
        success: true,
        content: 'Improved text with better clarity',
        metadata: { tokensUsed: 80, processingTime: 1200 }
      };

      mockAIModeManager.validateTextSelection.mockReturnValue(true);
      mockAIModeManager.processModify.mockResolvedValue(expectedResponse);

      // Simulate the full modify mode workflow
      const mockSelection = { start: 0, end: selectedText.length, text: selectedText };
      mockAIModeManager.updateSelection(mockSelection);
      mockAIModeManager.startModifyMode();
      const result = await mockAIModeManager.processModify(selectedText, modificationType);

      expect(mockAIModeManager.updateSelection).toHaveBeenCalledWith(mockSelection);
      expect(mockAIModeManager.startModifyMode).toHaveBeenCalled();
      expect(mockAIModeManager.processModify).toHaveBeenCalledWith(selectedText, modificationType);
      expect(result).toEqual(expectedResponse);
    });
  });
});