import { describe, it, expect, beforeEach } from 'vitest';
import { SearchHistoryManager } from '../worker/lib/search-history-manager';

describe('SearchHistoryManager', () => {
  let manager: SearchHistoryManager;
  const userId = 'user-1';

  beforeEach(() => {
    manager = new SearchHistoryManager();
  });

  describe('getStatistics', () => {
    it('should calculate statistics correctly for today, this week and this month', async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);

      const items = [
        { id: '1', userId, timestamp: now, query: 'today', sources: ['ideas'], results: { total: 1, accepted: 0, rejected: 0 } },
        { id: '2', userId, timestamp: today, query: 'today-start', sources: ['ideas'], results: { total: 1, accepted: 0, rejected: 0 } },
        { id: '3', userId, timestamp: yesterday, query: 'yesterday', sources: ['ideas'], results: { total: 1, accepted: 0, rejected: 0 } },
        { id: '4', userId, timestamp: lastWeek, query: 'last-week', sources: ['ideas'], results: { total: 1, accepted: 0, rejected: 0 } },
        { id: '5', userId, timestamp: lastMonth, query: 'last-month', sources: ['ideas'], results: { total: 1, accepted: 0, rejected: 0 } }
      ];

      // Populate history directly since it's private and we don't have a bulk load
      for (const item of items) {
        if (!(manager as any).history.has(userId)) {
          (manager as any).history.set(userId, []);
        }
        (manager as any).history.get(userId).push(item);
      }

      const stats = await manager.getStatistics(userId);

      expect(stats.totalSearches).toBe(5);
      expect(stats.searchesToday).toBe(2); // now, today
      expect(stats.searchesThisWeek).toBe(3); // now, today, yesterday
      expect(stats.searchesThisMonth).toBe(4); // now, today, yesterday, lastWeek
    });

    it('should handle empty history gracefully', async () => {
      const stats = await manager.getStatistics(userId);
      expect(stats.totalSearches).toBe(0);
      expect(stats.searchesToday).toBe(0);
      expect(stats.searchesThisWeek).toBe(0);
      expect(stats.searchesThisMonth).toBe(0);
    });
  });
});
