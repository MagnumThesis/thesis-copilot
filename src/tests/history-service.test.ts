import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryService } from '../worker/services/history-service';

vi.mock('../worker/lib/enhanced-search-history-manager', () => {
  return {
    EnhancedSearchHistoryManager: vi.fn().mockImplementation(() => {
      return {
        getSearchSessionDetails: vi.fn().mockImplementation((sessionId: string) => {
          if (sessionId === 'valid-session-id') {
            return Promise.resolve({
              session: { id: 'valid-session-id' },
              results: []
            });
          }
          return Promise.resolve(null);
        })
      };
    })
  };
});

describe('HistoryService.getSearchSessionDetails', () => {
  it('should throw if missing sessionId', async () => {
    await expect(HistoryService.getSearchSessionDetails({ env: {} } as any)).rejects.toThrow('missing sessionId');
  });

  it('should throw if missing env', async () => {
    await expect(HistoryService.getSearchSessionDetails({ metadata: { sessionId: '123' } } as any)).rejects.toThrow('Environment object is required');
  });

  it('should return session details if valid', async () => {
    const res = await HistoryService.getSearchSessionDetails({
      metadata: { sessionId: 'valid-session-id' },
      env: {}
    } as any);

    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data![0].session.id).toBe('valid-session-id');
  });

  it('should return success false if not found', async () => {
    const res = await HistoryService.getSearchSessionDetails({
      metadata: { sessionId: 'invalid-session-id' },
      env: {}
    } as any);

    expect(res.success).toBe(false);
    expect(res.metadata.error).toBe('Session not found');
  });
});
