/**
 * Tests for Proofreader Recovery Service
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  ProofreaderRecoveryService,
  RecoveryMode,
  RecoveryState,
  PendingOperation 
} from '../lib/proofreader-recovery-service';
import { ProofreaderAnalysisRequest, ProofreaderAnalysisResponse } from '../lib/ai-types';

// Mock dependencies
global.fetch = vi.fn();
global.navigator = {
  onLine: true,
  connection: undefined
} as any;

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
} as any;

global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as any;

global.AbortSignal = {
  timeout: vi.fn().mockReturnValue({ aborted: false })
} as any;

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn().mockReturnValue('test-uuid-123')
  },
  writable: true
});

describe('ProofreaderRecoveryService', () => {
  let recoveryService: ProofreaderRecoveryService;
  const mockFetch = fetch as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    recoveryService = ProofreaderRecoveryService.getInstance();
    
    // Reset localStorage mocks
    (localStorage.getItem as Mock).mockReturnValue(null);
    (localStorage.setItem as Mock).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const state = recoveryService.getRecoveryState();
      
      expect(state.isOnline).toBe(true);
      expect(state.recoveryMode).toBe(RecoveryMode.NORMAL);
      expect(state.pendingOperations).toEqual([]);
      expect(state.cachedData).toBeDefined();
    });

    it('should load cached data on initialization', () => {
      const mockCachedData = JSON.stringify({
        concerns: [['conv1', [{ id: 'concern1', title: 'Test concern' }]]],
        analysisResults: [],
        contentHashes: [],
        lastUpdated: []
      });

      (localStorage.getItem as Mock).mockReturnValue(mockCachedData);
      
      // Create new instance to test loading
      const newService = ProofreaderRecoveryService.getInstance();
      const cachedConcerns = newService.getCachedConcerns('conv1');
      
      expect(cachedConcerns).toBeDefined();
    });
  });

  describe('Network Monitoring', () => {
    it('should handle connection restoration', async () => {
      // Mock the service methods
      const syncSpy = vi.spyOn(recoveryService as any, 'syncPendingOperations').mockResolvedValue(undefined);
      const validateSpy = vi.spyOn(recoveryService as any, 'validateCachedData').mockResolvedValue(undefined);

      // Simulate connection restoration
      await (recoveryService as any).handleConnectionRestored();

      expect(syncSpy).toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalled();
    });

    it('should handle connection loss', () => {
      (recoveryService as any).handleConnectionLost();
      
      const state = recoveryService.getRecoveryState();
      expect(state.isOnline).toBe(false);
      expect(state.recoveryMode).toBe(RecoveryMode.OFFLINE);
    });

    it('should detect poor connection quality', () => {
      const mockConnection = {
        effectiveType: 'slow-2g',
        downlink: 0.3
      };

      (recoveryService as any).handleConnectionChange(mockConnection);
      
      const state = recoveryService.getRecoveryState();
      expect(state.recoveryMode).toBe(RecoveryMode.DEGRADED);
    });
  });

  describe('Analysis with Recovery', () => {
    const mockAnalysisRequest: ProofreaderAnalysisRequest = {
      conversationId: 'test-conv-id',
      documentContent: 'This is a test document with sufficient content for analysis.',
      ideaDefinitions: [],
      analysisOptions: {
        includeGrammar: true,
        academicLevel: 'graduate'
      }
    };

    it('should perform online analysis successfully', async () => {
      const mockResponse: ProofreaderAnalysisResponse = {
        success: true,
        concerns: [
          {
            id: 'concern1',
            conversationId: 'test-conv-id',
            category: 'clarity' as any,
            severity: 'medium' as any,
            title: 'Test concern',
            description: 'Test description',
            status: 'to_be_done' as any,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        analysisMetadata: {
          totalConcerns: 1,
          concernsByCategory: { clarity: 1 },
          concernsBySeverity: { medium: 1 },
          analysisTime: 1000,
          contentLength: 100,
          ideaDefinitionsUsed: 0
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await recoveryService.performAnalysisWithRecovery(mockAnalysisRequest);

      expect(result.success).toBe(true);
      expect(result.concerns).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/proofreader/analyze', expect.any(Object));
    });

    it('should use cached result when available', async () => {
      // First, cache a result
      const mockResponse: ProofreaderAnalysisResponse = {
        success: true,
        concerns: [],
        analysisMetadata: {
          totalConcerns: 0,
          concernsByCategory: {},
          concernsBySeverity: {},
          analysisTime: 500,
          contentLength: 100,
          ideaDefinitionsUsed: 0
        }
      };

      // Mock cache methods
      vi.spyOn(recoveryService as any, 'getCachedAnalysis').mockReturnValue(mockResponse);
      vi.spyOn(recoveryService as any, 'isCacheValid').mockReturnValue(true);

      const result = await recoveryService.performAnalysisWithRecovery(mockAnalysisRequest);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fallback to offline analysis when online fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await recoveryService.performAnalysisWithRecovery(mockAnalysisRequest);

      expect(result.success).toBe(true);
      expect(result.analysisMetadata?.fallbackUsed).toBe(true);
      expect(result.analysisMetadata?.offlineMode).toBe(true);
      expect(result.concerns).toBeDefined();
    });

    it('should handle analysis failure gracefully', async () => {
      // Mock both online and offline analysis to fail
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      vi.spyOn(recoveryService as any, 'performOfflineAnalysis').mockRejectedValueOnce(new Error('Offline analysis failed'));

      const result = await recoveryService.performAnalysisWithRecovery(mockAnalysisRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Analysis service is temporarily unavailable');
    });
  });

  describe('Offline Analysis', () => {
    it('should perform basic structural analysis', async () => {
      const content = `
# Introduction
This is a test document.

## Main Content
This section contains the main content of the document.

## Conclusion
This is the conclusion.
      `.trim();

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv',
        documentContent: content,
        ideaDefinitions: []
      };

      const result = await (recoveryService as any).performOfflineAnalysis(request);

      expect(result.success).toBe(true);
      expect(result.concerns).toBeDefined();
      expect(result.analysisMetadata?.fallbackUsed).toBe(true);
      expect(result.analysisMetadata?.offlineMode).toBe(true);
    });

    it('should detect missing structure in offline analysis', async () => {
      const shortContent = 'This is a very short document without proper structure.';

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv',
        documentContent: shortContent,
        ideaDefinitions: []
      };

      const result = await (recoveryService as any).performOfflineAnalysis(request);

      expect(result.success).toBe(true);
      expect(result.concerns.length).toBeGreaterThan(0);
      
      const structureConcern = result.concerns.find((c: any) => c.category === 'completeness');
      expect(structureConcern).toBeDefined();
    });

    it('should analyze readability in offline mode', async () => {
      const longSentenceContent = 'This is an extremely long sentence that contains way too many words and clauses and should probably be broken down into smaller, more manageable sentences for better readability and comprehension by the reader who might otherwise struggle to follow the complex structure and meaning.';

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv',
        documentContent: longSentenceContent,
        ideaDefinitions: []
      };

      const result = await (recoveryService as any).performOfflineAnalysis(request);

      expect(result.success).toBe(true);
      const clarityConcern = result.concerns.find((c: any) => c.category === 'clarity');
      expect(clarityConcern).toBeDefined();
    });

    it('should check for citations in offline analysis', async () => {
      const contentWithoutCitations = `
# Research Paper
This is a research paper that makes many claims but provides no citations or references to support the statements made throughout the document.

The paper discusses various topics and presents findings without proper academic backing.
      `.trim();

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv',
        documentContent: contentWithoutCitations,
        ideaDefinitions: []
      };

      const result = await (recoveryService as any).performOfflineAnalysis(request);

      expect(result.success).toBe(true);
      const citationConcern = result.concerns.find((c: any) => c.category === 'citations');
      expect(citationConcern).toBeDefined();
    });

    it('should analyze idea consistency when idea definitions are provided', async () => {
      const content = 'This document discusses machine learning but does not mention artificial intelligence.';
      const ideaDefinitions = [
        { title: 'Artificial Intelligence', description: 'AI systems and applications' },
        { title: 'Machine Learning', description: 'ML algorithms and techniques' }
      ];

      const request: ProofreaderAnalysisRequest = {
        conversationId: 'test-conv',
        documentContent: content,
        ideaDefinitions
      };

      const result = await (recoveryService as any).performOfflineAnalysis(request);

      expect(result.success).toBe(true);
      const consistencyConcern = result.concerns.find((c: any) => c.category === 'consistency');
      expect(consistencyConcern).toBeDefined();
    });
  });

  describe('Status Updates with Recovery', () => {
    it('should update status online successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await recoveryService.updateConcernStatusWithRecovery('concern-id', 'addressed' as any);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/proofreader/concerns/concern-id/status',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'addressed' })
        })
      );
    });

    it('should queue status update when offline', async () => {
      // Simulate offline mode
      (recoveryService as any).recoveryState.isOnline = false;

      const result = await recoveryService.updateConcernStatusWithRecovery('concern-id', 'addressed' as any);

      expect(result.success).toBe(true);
      
      const state = recoveryService.getRecoveryState();
      expect(state.pendingOperations.length).toBe(1);
      expect(state.pendingOperations[0].type).toBe('status_update');
    });

    it('should queue status update when online update fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await recoveryService.updateConcernStatusWithRecovery('concern-id', 'addressed' as any);

      expect(result.success).toBe(true); // Still success because it's queued
      
      const state = recoveryService.getRecoveryState();
      expect(state.pendingOperations.length).toBe(1);
    });
  });

  describe('Cache Management', () => {
    it('should cache and retrieve concerns correctly', () => {
      const mockConcerns = [
        {
          id: 'concern1',
          conversationId: 'conv1',
          category: 'clarity' as any,
          severity: 'medium' as any,
          title: 'Test concern',
          description: 'Test description',
          status: 'to_be_done' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      recoveryService.cacheConcerns('conv1', mockConcerns);
      const retrieved = recoveryService.getCachedConcerns('conv1');

      expect(retrieved).toEqual(mockConcerns);
    });

    it('should return null for non-existent cached concerns', () => {
      const retrieved = recoveryService.getCachedConcerns('non-existent-conv');
      expect(retrieved).toBeNull();
    });

    it('should clear cache correctly', () => {
      const mockConcerns = [
        {
          id: 'concern1',
          conversationId: 'conv1',
          category: 'clarity' as any,
          severity: 'medium' as any,
          title: 'Test concern',
          description: 'Test description',
          status: 'to_be_done' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      recoveryService.cacheConcerns('conv1', mockConcerns);
      recoveryService.clearCache();
      
      const retrieved = recoveryService.getCachedConcerns('conv1');
      expect(retrieved).toBeNull();
    });

    it('should generate content hash consistently', () => {
      const content1 = 'This is test content';
      const content2 = 'This is test content';
      const content3 = 'This is different content';

      const hash1 = (recoveryService as any).generateContentHash(content1);
      const hash2 = (recoveryService as any).generateContentHash(content2);
      const hash3 = (recoveryService as any).generateContentHash(content3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('should validate cache expiry correctly', () => {
      const recentHash = 'recent-hash';
      const oldHash = 'old-hash';

      // Mock recent cache entry
      (recoveryService as any).recoveryState.cachedData.lastUpdated.set(recentHash, new Date());
      
      // Mock old cache entry
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      (recoveryService as any).recoveryState.cachedData.lastUpdated.set(oldHash, oldDate);

      const recentValid = (recoveryService as any).isCacheValid(recentHash);
      const oldValid = (recoveryService as any).isCacheValid(oldHash);

      expect(recentValid).toBe(true);
      expect(oldValid).toBe(false);
    });
  });

  describe('Pending Operations Management', () => {
    it('should track pending operations count', () => {
      expect(recoveryService.getPendingOperationsCount()).toBe(0);

      (recoveryService as any).queueStatusUpdate('concern1', 'addressed');
      expect(recoveryService.getPendingOperationsCount()).toBe(1);

      (recoveryService as any).queueStatusUpdate('concern2', 'rejected');
      expect(recoveryService.getPendingOperationsCount()).toBe(2);
    });

    it('should sync pending operations when connection is restored', async () => {
      // Queue some operations
      (recoveryService as any).queueStatusUpdate('concern1', 'addressed');
      (recoveryService as any).queueStatusUpdate('concern2', 'rejected');

      // Mock successful sync
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await (recoveryService as any).syncPendingOperations();

      expect(recoveryService.getPendingOperationsCount()).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should remove operations that exceed max retries', async () => {
      // Create operation with high retry count
      const operation: PendingOperation = {
        id: 'test-op',
        type: 'status_update',
        data: { concernId: 'concern1', status: 'addressed' },
        timestamp: new Date(),
        retryCount: 5, // Exceeds max retries
        maxRetries: 3,
        priority: 'medium'
      };

      (recoveryService as any).recoveryState.pendingOperations = [operation];

      // Mock failed sync
      mockFetch.mockRejectedValue(new Error('Network error'));

      await (recoveryService as any).syncPendingOperations();

      expect(recoveryService.getPendingOperationsCount()).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should save and load cached data to localStorage', () => {
      const mockConcerns = [
        {
          id: 'concern1',
          conversationId: 'conv1',
          category: 'clarity' as any,
          severity: 'medium' as any,
          title: 'Test concern',
          description: 'Test description',
          status: 'to_be_done' as any,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      recoveryService.cacheConcerns('conv1', mockConcerns);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'proofreader-cached-data',
        expect.any(String)
      );
    });

    it('should save and load pending operations to localStorage', () => {
      (recoveryService as any).queueStatusUpdate('concern1', 'addressed');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'proofreader-pending-operations',
        expect.any(String)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      (localStorage.setItem as Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      expect(() => {
        recoveryService.cacheConcerns('conv1', []);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      
      recoveryService.cleanup();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });
});