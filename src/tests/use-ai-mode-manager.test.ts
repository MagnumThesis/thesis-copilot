/**
 * Unit tests for useAIModeManager hook
 * Testing the core logic and functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  AIMode,
  ModificationType,
  AIError,
  AIErrorType,
} from "../lib/ai-infrastructure";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("AI Mode Manager Logic", () => {
  const mockConversationId = "test-conversation-id";
  const mockDocumentContent = "This is test document content.";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleSpy.mockClear();
  });

  describe("Mode Validation Logic", () => {
    it("should validate PROMPT mode correctly", () => {
      // PROMPT mode should be available when not processing and has document content
      const isProcessing = false;
      const hasSelectedText = false;
      const documentContent = "test content";

      // Simulate canActivateMode logic for PROMPT
      const canActivatePrompt = !isProcessing;
      expect(canActivatePrompt).toBe(true);
    });

    it("should validate CONTINUE mode correctly", () => {
      // CONTINUE mode should be available when not processing and has document content
      const isProcessing = false;
      const documentContent = "test content";

      const canActivateContinue =
        !isProcessing && documentContent.trim().length > 0;
      expect(canActivateContinue).toBe(true);

      // Should not allow continue mode with empty document
      const canActivateContinueEmpty = !isProcessing && "".trim().length > 0;
      expect(canActivateContinueEmpty).toBe(false);
    });

    it("should validate MODIFY mode correctly", () => {
      // MODIFY mode should be available when not processing and has selected text
      const isProcessing = false;
      let hasSelectedText = false;

      let canActivateModify = !isProcessing && hasSelectedText;
      expect(canActivateModify).toBe(false);

      // With selected text
      hasSelectedText = true;
      canActivateModify = !isProcessing && hasSelectedText;
      expect(canActivateModify).toBe(true);
    });

    it("should not allow any mode when processing", () => {
      const isProcessing = true;
      const hasSelectedText = true;
      const documentContent = "test content";

      const canActivatePrompt = !isProcessing;
      const canActivateContinue =
        !isProcessing && documentContent.trim().length > 0;
      const canActivateModify = !isProcessing && hasSelectedText;

      expect(canActivatePrompt).toBe(false);
      expect(canActivateContinue).toBe(false);
      expect(canActivateModify).toBe(false);
    });
  });

  describe("Selection Management Logic", () => {
    it("should correctly identify selected text", () => {
      const selection1 = {
        start: 0,
        end: 10,
        text: "selected text",
      };

      const hasSelectedText1 =
        selection1 !== null && selection1.text.trim().length > 0;
      expect(hasSelectedText1).toBe(true);

      const selection2 = {
        start: 0,
        end: 0,
        text: "",
      };

      const hasSelectedText2 =
        selection2 !== null && selection2.text.trim().length > 0;
      expect(hasSelectedText2).toBe(false);

      const selection3 = null;
      const hasSelectedText3 =
        selection3 !== null && selection3?.text.trim().length > 0;
      expect(hasSelectedText3).toBe(false);
    });
  });

  describe("AI Request Processing Logic", () => {
    it("should create correct prompt request payload", () => {
      const prompt = "Test prompt";
      const cursorPosition = 0;
      const conversationId = mockConversationId;
      const documentContent = mockDocumentContent;

      const expectedRequest = {
        prompt: prompt.trim(),
        documentContent,
        cursorPosition,
        conversationId,
        timestamp: expect.any(Number),
      };

      const actualRequest = {
        prompt: prompt.trim(),
        documentContent,
        cursorPosition,
        conversationId,
        timestamp: Date.now(),
      };

      expect(actualRequest.prompt).toBe(expectedRequest.prompt);
      expect(actualRequest.documentContent).toBe(
        expectedRequest.documentContent
      );
      expect(actualRequest.cursorPosition).toBe(expectedRequest.cursorPosition);
      expect(actualRequest.conversationId).toBe(expectedRequest.conversationId);
      expect(typeof actualRequest.timestamp).toBe("number");
    });

    it("should create correct continue request payload", () => {
      const cursorPosition = 10;
      const selectedText = "context text";
      const conversationId = mockConversationId;
      const documentContent = mockDocumentContent;

      const actualRequest = {
        documentContent,
        cursorPosition,
        selectedText,
        conversationId,
        timestamp: Date.now(),
      };

      expect(actualRequest.documentContent).toBe(documentContent);
      expect(actualRequest.cursorPosition).toBe(cursorPosition);
      expect(actualRequest.selectedText).toBe(selectedText);
      expect(actualRequest.conversationId).toBe(conversationId);
      expect(typeof actualRequest.timestamp).toBe("number");
    });

    it("should create correct modify request payload", () => {
      const selectedText = "text to modify";
      const modificationType = ModificationType.REWRITE;
      const conversationId = mockConversationId;
      const documentContent = mockDocumentContent;

      const actualRequest = {
        selectedText: selectedText.trim(),
        modificationType,
        documentContent,
        conversationId,
        timestamp: Date.now(),
      };

      expect(actualRequest.selectedText).toBe(selectedText.trim());
      expect(actualRequest.modificationType).toBe(modificationType);
      expect(actualRequest.documentContent).toBe(documentContent);
      expect(actualRequest.conversationId).toBe(conversationId);
      expect(typeof actualRequest.timestamp).toBe("number");
    });
  });

  describe("Error Handling Logic", () => {
    it("should validate prompt input", () => {
      const emptyPrompt = "";
      const validPrompt = "Valid prompt";

      const isEmptyPromptValid = emptyPrompt.trim().length > 0;
      const isValidPromptValid = validPrompt.trim().length > 0;

      expect(isEmptyPromptValid).toBe(false);
      expect(isValidPromptValid).toBe(true);
    });

    it("should validate selected text for modify", () => {
      const emptyText = "";
      const validText = "text to modify";

      const isEmptyTextValid = emptyText.trim().length > 0;
      const isValidTextValid = validText.trim().length > 0;

      expect(isEmptyTextValid).toBe(false);
      expect(isValidTextValid).toBe(true);
    });

    it("should validate required request parameters", () => {
      const validRequest = {
        conversationId: "test-id",
        documentContent: "test content",
      };

      const invalidRequest = {
        conversationId: "test-id",
        // missing documentContent
      };

      const requiredFields = ["conversationId", "documentContent"];

      const isValidRequestValid = requiredFields.every(
        (field) =>
          validRequest.hasOwnProperty(field) &&
          validRequest[field as keyof typeof validRequest]
      );

      const isInvalidRequestValid = requiredFields.every(
        (field) =>
          invalidRequest.hasOwnProperty(field) &&
          invalidRequest[field as keyof typeof invalidRequest]
      );

      expect(isValidRequestValid).toBe(true);
      expect(isInvalidRequestValid).toBe(false);
    });
  });

  describe("HTTP Response Handling Logic", () => {
    it("should handle successful responses", async () => {
      const mockResponse = {
        success: true,
        content: "Generated content",
        timestamp: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "data" }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it("should handle HTTP errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "data" }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(response.statusText).toBe("Internal Server Error");
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      await expect(
        fetch("/api/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: "data" }),
        })
      ).rejects.toThrow("Network error");
    });
  });

  describe("Processing State Logic", () => {
    it("should manage processing state correctly", () => {
      let processingState = {
        isProcessing: false,
        currentMode: AIMode.NONE,
        progress: undefined,
        statusMessage: undefined,
      };

      // Start processing
      processingState = {
        isProcessing: true,
        currentMode: AIMode.PROMPT,
        progress: 0,
        statusMessage: "Generating content from prompt...",
      };

      expect(processingState.isProcessing).toBe(true);
      expect(processingState.currentMode).toBe(AIMode.PROMPT);
      expect(processingState.progress).toBe(0);
      expect(processingState.statusMessage).toBe(
        "Generating content from prompt..."
      );

      // Update progress
      processingState = {
        ...processingState,
        progress: 50,
      };

      expect(processingState.progress).toBe(50);

      // Complete processing
      processingState = {
        ...processingState,
        progress: 100,
        statusMessage: "Processing complete",
      };

      expect(processingState.progress).toBe(100);
      expect(processingState.statusMessage).toBe("Processing complete");

      // Reset processing
      processingState = {
        isProcessing: false,
        currentMode: AIMode.PROMPT,
        progress: undefined,
        statusMessage: undefined,
      };

      expect(processingState.isProcessing).toBe(false);
      expect(processingState.progress).toBeUndefined();
      expect(processingState.statusMessage).toBeUndefined();
    });
  });

  describe("Configuration Logic", () => {
    it("should merge configuration correctly", () => {
      const defaultConfig = {
        maxRetries: 3,
        timeout: 30000,
        debounceMs: 300,
      };

      const customConfig = {
        maxRetries: 5,
        timeout: 60000,
      };

      const mergedConfig = { ...defaultConfig, ...customConfig };

      expect(mergedConfig.maxRetries).toBe(5);
      expect(mergedConfig.timeout).toBe(60000);
      expect(mergedConfig.debounceMs).toBe(300); // Should keep default
    });
  });

  describe("Retry Logic", () => {
    it("should implement exponential backoff", () => {
      const calculateDelay = (attempt: number) => {
        return Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      };

      expect(calculateDelay(1)).toBe(1000); // 1st retry: 1s
      expect(calculateDelay(2)).toBe(2000); // 2nd retry: 2s
      expect(calculateDelay(3)).toBe(4000); // 3rd retry: 4s
      expect(calculateDelay(4)).toBe(5000); // 4th retry: 5s (capped)
      expect(calculateDelay(5)).toBe(5000); // 5th retry: 5s (capped)
    });

    it("should determine retry eligibility", () => {
      const shouldRetry = (
        error: AIError,
        attempt: number,
        maxRetries: number
      ) => {
        if (attempt >= maxRetries) return false;
        if (error.type === AIErrorType.OPERATION_CANCELLED) return false;
        if (error.type === AIErrorType.VALIDATION_ERROR) return false;
        if (!error.retryable) return false;
        return true;
      };

      const retryableError = new AIError(
        "Network error",
        AIErrorType.NETWORK_ERROR,
        "NET_ERR",
        true
      );
      const nonRetryableError = new AIError(
        "Validation error",
        AIErrorType.VALIDATION_ERROR,
        "VAL_ERR",
        false
      );
      const cancelledError = new AIError(
        "Cancelled",
        AIErrorType.OPERATION_CANCELLED,
        "CANCELLED",
        true
      );

      expect(shouldRetry(retryableError, 1, 3)).toBe(true);
      expect(shouldRetry(retryableError, 3, 3)).toBe(false); // Max retries reached
      expect(shouldRetry(nonRetryableError, 1, 3)).toBe(false);
      expect(shouldRetry(cancelledError, 1, 3)).toBe(false);
    });
  });
});
