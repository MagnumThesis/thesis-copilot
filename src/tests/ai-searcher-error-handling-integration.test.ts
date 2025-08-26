/**
 * Integration Tests for AI Searcher Comprehensive Error Handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { AISearcherAPIHandler } from '../worker/handlers/ai-searcher-api';
import { EnhancedGoogleScholarClient } from '../worker/lib/enhanced-google-scholar-client';
import { AISearcherErrorHandler } from '../lib/ai-searcher-error-handling';
import { AISearcherMonitoringService } from '../lib/ai-searcher-monitoring';

// Mock the enhanced Google Scholar client
vi.mock('../worker/lib/enhanced-google-scholar-client');
vi.mock('../lib/ai-searcher-error-handling');
vi.mock('../lib/ai-searcher-monitoring');

// Mock console methods
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn()
};

global.console = mockConsole as any;

// Mock crypto for request IDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  },
  writable: true
});

describe('AI Searcher Error Handling Integration', () => {
  let apiHandler: AISearcherAPIHandler;
  let mockScholarClient: any;
  let mockErrorHandler: any;
  let mockMonitoringService: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    mockScholarClient = {
      search: vi.fn(),
      getFallbackServiceStatus: vi.fn().mockResolvedValue({
        semantic_scholar: true,
        crossref: true,
        arxiv: false
      })
    };

    mockErrorHandler = {
      handleError: vi.fn(),
      executeWithRetry: vi.fn(),
      getErrorMetrics: vi.fn().mockReturnValue({
        totalErrors: 5,
        errorsByType: {},
        errorsBySeverity: {},
        retrySuccessRate: 0.8,
        fallbackSuccessRate: 0.6,
        averageRecoveryTime: 2500,
        mostCommonErrors: []
      })
    };

    mockMonitoringService = {
      logError: vi.fn(),
      logInfo: vi.fn(),
      logPerformance: vi.fn(),
      getHealthStatus: vi.fn().mockReturnValue({
        status: 'healthy',
        issues: [],
        metrics: {
          errorRate: 0.05,
          averageResponseTime: 1500,
          fallbackRate: 0.1,
          degradedModeRate: 0.02
        }
      }),
      getPerformanceMetrics: vi.fn().mockReturnValue({
        averageDuration: 1500,
        successRate: 0.95,
        totalOperations: 100,
        retryRate: 0.15,
        fallbackRate: 0.1,
        degradedModeRate: 0.02
      }),
      getRecentEvents: vi.fn().mockReturnValue([])
    };

    // Mock the static getInstance methods
    (AISearcherErrorHandler.getInstance as Mock).mockReturnValue(mockErrorHandler);
    (AISearcherMonitoringService.getInstance as Mock).mockReturnValue(mockMonitoringService);
    (EnhancedGoogleScholarClient as any).mockImplementation(() => mockScholarClient);

    apiHandler = new AISearcherAPIHandler();

    // Mock context
    mockContext = {
      req: {
        json: vi.fn(),
        query: vi.fn()
      },
      json: vi.fn(),
      env: {
        DB: {},
        SUPABASE_URL: 'test-url',
        SUPABASE_ANON: 'test-key'
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Successful Search with Error Handling', () => {
    it('should handle successful search and log performance metrics', async () => {
      const mockSearchResult = {
        results: [
          {
            title: 'Test Paper',
            authors: ['Test Author'],
            journal: 'Test Journal',
            year: 2023,
            confidence: 0.9,
            relevance_score: 0.8
          }
        ],
        source: 'google_scholar',
        success: true,
        fallbackUsed: false,
        degradedMode: false,
        processingTime: 1500,
        retryCount: 0
      };

      mockScholarClient.search.mockResolvedValue(mockSearchResult);
      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        query: 'test query'
      });

      await apiHandler.search(mockContext);

      expect(mockMonitoringService.logInfo).toHaveBeenCalledWith(
        expect.stringContaining('Starting search'),
        'search',
        expect.any(Object),
        expect.any(Object)
      );

      expect(mockMonitoringService.logPerformance).toHaveBeenCalledWith({
        operationType: 'search',
        duration: 1500,
        success: true,
        retryCount: 0,
        fallbackUsed: false,
        degradedMode: false,
        timestamp: expect.any(Date),
        context: expect.any(Object)
      });

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          search_metadata: {
            source: 'google_scholar',
            fallback_used: false,
            degraded_mode: false,
            error_handled: undefined
          }
        })
      );
    });
  });

  describe('Search with Fallback', () => {
    it('should handle search with fallback and include metadata', async () => {
      const mockSearchResult = {
        results: [
          {
            title: 'Fallback Paper',
            authors: ['Fallback Author'],
            journal: 'Semantic Scholar',
            year: 2023,
            confidence: 0.7,
            relevance_score: 0.6
          }
        ],
        source: 'semantic_scholar',
        success: true,
        fallbackUsed: true,
        degradedMode: false,
        processingTime: 3000,
        retryCount: 2
      };

      mockScholarClient.search.mockResolvedValue(mockSearchResult);
      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        query: 'test query'
      });

      await apiHandler.search(mockContext);

      expect(mockMonitoringService.logPerformance).toHaveBeenCalledWith({
        operationType: 'search',
        duration: 3000,
        success: true,
        retryCount: 2,
        fallbackUsed: true,
        degradedMode: false,
        timestamp: expect.any(Date),
        context: expect.any(Object)
      });

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          search_metadata: {
            source: 'semantic_scholar',
            fallback_used: true,
            degraded_mode: false,
            error_handled: undefined
          }
        })
      );
    });
  });

  describe('Search with Degraded Mode', () => {
    it('should handle search in degraded mode and include error information', async () => {
      const mockError = {
        type: 'service_unavailable_error',
        severity: 'high',
        userMessage: 'Search service is temporarily unavailable',
        recoveryActions: [
          {
            type: 'retry',
            label: 'Try Again',
            description: 'Retry the operation',
            priority: 1
          },
          {
            type: 'manual',
            label: 'Search Manually',
            description: 'Use Google Scholar directly',
            priority: 2
          }
        ]
      };

      const mockSearchResult = {
        results: [
          {
            title: 'Search temporarily unavailable: "test query"',
            authors: ['System Message'],
            journal: 'Thesis Copilot',
            confidence: 0.1,
            relevance_score: 0.1
          }
        ],
        source: 'degraded_mode',
        success: true,
        error: mockError,
        fallbackUsed: false,
        degradedMode: true,
        processingTime: 500,
        retryCount: 3
      };

      mockScholarClient.search.mockResolvedValue(mockSearchResult);
      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        query: 'test query'
      });

      await apiHandler.search(mockContext);

      expect(mockMonitoringService.logPerformance).toHaveBeenCalledWith({
        operationType: 'search',
        duration: 500,
        success: true,
        retryCount: 3,
        fallbackUsed: false,
        degradedMode: true,
        timestamp: expect.any(Date),
        context: expect.any(Object)
      });

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          search_metadata: {
            source: 'degraded_mode',
            fallback_used: false,
            degraded_mode: true,
            error_handled: {
              type: 'service_unavailable_error',
              severity: 'high',
              user_message: 'Search service is temporarily unavailable',
              recovery_actions: [
                {
                  type: 'retry',
                  label: 'Try Again',
                  description: 'Retry the operation',
                  priority: 1
                },
                {
                  type: 'manual',
                  label: 'Search Manually',
                  description: 'Use Google Scholar directly',
                  priority: 2
                }
              ]
            }
          }
        })
      );
    });
  });

  describe('Complete Search Failure', () => {
    it('should handle complete search failure with comprehensive error handling', async () => {
      const mockError = new Error('Complete system failure');
      const mockAISearcherError = {
        type: 'unknown_error',
        severity: 'critical',
        userMessage: 'An unexpected error occurred',
        recoveryActions: [
          {
            type: 'retry',
            label: 'Try Again',
            description: 'Retry the operation',
            priority: 1
          }
        ]
      };

      mockScholarClient.search.mockRejectedValue(mockError);
      mockErrorHandler.handleError.mockResolvedValue(mockAISearcherError);
      
      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        query: 'test query'
      });

      await apiHandler.search(mockContext);

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        mockError,
        'search',
        expect.objectContaining({
          conversationId: 'test-conv-123',
          query: 'test query'
        })
      );

      expect(mockMonitoringService.logError).toHaveBeenCalledWith(mockAISearcherError);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Still returns success with fallback results
          search_metadata: {
            source: 'error_fallback',
            fallback_used: false,
            degraded_mode: true,
            error_handled: {
              type: 'unknown_error',
              severity: 'critical',
              user_message: 'An unexpected error occurred',
              recovery_actions: [
                {
                  type: 'retry',
                  label: 'Try Again',
                  description: 'Retry the operation',
                  priority: 1
                }
              ]
            }
          }
        })
      );
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return comprehensive health status', async () => {
      mockContext.req.query.mockReturnValue('');

      await apiHandler.getHealth(mockContext);

      expect(mockMonitoringService.getHealthStatus).toHaveBeenCalled();
      expect(mockErrorHandler.getErrorMetrics).toHaveBeenCalled();
      expect(mockMonitoringService.getPerformanceMetrics).toHaveBeenCalled();
      expect(mockScholarClient.getFallbackServiceStatus).toHaveBeenCalled();
      expect(mockMonitoringService.getRecentEvents).toHaveBeenCalledWith(50, 'error');

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          health: {
            status: 'healthy',
            issues: [],
            metrics: expect.any(Object),
            timestamp: expect.any(String)
          },
          error_metrics: expect.any(Object),
          performance_metrics: expect.any(Object),
          fallback_services: {
            semantic_scholar: true,
            crossref: true,
            arxiv: false
          },
          recent_errors: [],
          system_info: {
            uptime: expect.any(Number),
            version: '1.0.0',
            features: {
              comprehensive_error_handling: true,
              fallback_services: true,
              degraded_mode: true,
              monitoring: true,
              circuit_breakers: true
            }
          },
          processingTime: expect.any(Number)
        })
      );
    });

    it('should handle health check failure gracefully', async () => {
      mockMonitoringService.getHealthStatus.mockImplementation(() => {
        throw new Error('Health check system failure');
      });

      await apiHandler.getHealth(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          health: {
            status: 'unhealthy',
            issues: ['Health check system failure'],
            metrics: expect.any(Object),
            timestamp: expect.any(String)
          },
          error: 'Health check system failure',
          processingTime: expect.any(Number)
        }),
        500
      );
    });
  });

  describe('Content Extraction Error Handling', () => {
    it('should handle content extraction errors gracefully', async () => {
      const mockContentError = new Error('Content extraction failed');
      const mockAISearcherError = {
        type: 'content_extraction_error',
        severity: 'medium',
        userMessage: 'Unable to analyze your content',
        recoveryActions: [
          {
            type: 'manual',
            label: 'Select Different Content',
            description: 'Try selecting different content sources',
            priority: 1
          }
        ]
      };

      // Mock content extraction failure
      mockErrorHandler.executeWithRetry.mockRejectedValue(mockContentError);
      mockErrorHandler.handleError.mockResolvedValue(mockAISearcherError);

      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        contentSources: [
          { source: 'ideas', id: 'idea-123' }
        ]
      });

      await apiHandler.search(mockContext);

      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        mockContentError,
        expect.stringContaining('content'),
        expect.any(Object)
      );

      expect(mockMonitoringService.logError).toHaveBeenCalledWith(mockAISearcherError);
    });
  });

  describe('Query Generation Error Handling', () => {
    it('should handle query generation errors and provide manual fallback', async () => {
      const mockQueryError = new Error('Query generation failed');
      const mockAISearcherError = {
        type: 'query_generation_error',
        severity: 'low',
        userMessage: 'Unable to generate search terms from your content',
        recoveryActions: [
          {
            type: 'manual',
            label: 'Enter Search Terms Manually',
            description: 'Provide your own search terms',
            priority: 1
          }
        ]
      };

      mockErrorHandler.executeWithRetry.mockRejectedValue(mockQueryError);
      mockErrorHandler.handleError.mockResolvedValue(mockAISearcherError);

      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        contentSources: [
          { source: 'builder', id: 'builder-123' }
        ]
      });

      await apiHandler.search(mockContext);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required (either directly or via content sources)'
        }),
        400
      );
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics for all operations', async () => {
      const mockSearchResult = {
        results: [],
        source: 'google_scholar',
        success: true,
        fallbackUsed: false,
        degradedMode: false,
        processingTime: 2500,
        retryCount: 1
      };

      mockScholarClient.search.mockResolvedValue(mockSearchResult);
      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        query: 'performance test'
      });

      await apiHandler.search(mockContext);

      expect(mockMonitoringService.logPerformance).toHaveBeenCalledWith({
        operationType: 'search',
        duration: 2500,
        success: true,
        retryCount: 1,
        fallbackUsed: false,
        degradedMode: false,
        timestamp: expect.any(Date),
        context: expect.objectContaining({
          query: 'performance test',
          resultCount: 0,
          source: 'google_scholar'
        })
      });
    });
  });

  describe('Error Recovery Instructions', () => {
    it('should provide helpful recovery instructions in error responses', async () => {
      const mockError = new Error('Rate limit exceeded');
      const mockAISearcherError = {
        type: 'rate_limit_error',
        severity: 'medium',
        userMessage: 'Too many searches performed recently',
        retryAfter: 30000, // 30 seconds
        recoveryActions: [
          {
            type: 'retry',
            label: 'Try Again',
            description: 'Wait 30 seconds and retry',
            priority: 1
          },
          {
            type: 'manual',
            label: 'Refine Query',
            description: 'Try a more specific search query',
            priority: 2
          }
        ]
      };

      mockScholarClient.search.mockRejectedValue(mockError);
      mockErrorHandler.handleError.mockResolvedValue(mockAISearcherError);

      mockContext.req.json.mockResolvedValue({
        conversationId: 'test-conv-123',
        query: 'test query'
      });

      await apiHandler.search(mockContext);

      // Check that the fallback result includes recovery instructions
      const callArgs = mockContext.json.mock.calls[0][0];
      const fallbackResult = callArgs.results[0];
      
      expect(fallbackResult.abstract).toContain('Recovery options');
      expect(fallbackResult.abstract).toContain('Wait 30 seconds and retry');
      expect(fallbackResult.abstract).toContain('Try a more specific search query');
    });
  });
});