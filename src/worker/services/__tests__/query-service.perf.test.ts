import { describe, it, expect, vi } from 'vitest';
import { QueryService } from '../query-service';

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn().mockImplementation(() => {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => resolve({ data: { id: 1, message_id: '1', description: 'test', title: 'test', content: 'test' }, error: null }), 10);
    });
  }),
  then: vi.fn().mockImplementation((cb) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(cb({ data: Array(50).fill(0).map((_, i) => ({ id: i, message_id: String(i), description: 'test', title: 'test', content: 'test' })), error: null }));
      }, 15);
    });
  })
};

vi.mock('../../lib/supabase', () => ({
  getSupabase: () => mockSupabase
}));

describe('QueryService Performance', () => {
  it('measures performance of extractContent', async () => {
    const contentSources = Array.from({ length: 50 }, (_, i) => ({
      source: i % 2 === 0 ? 'ideas' : 'builder',
      id: String(i)
    }));

    const start = performance.now();
    await QueryService.extractContent({ contentSources });
    const end = performance.now();

    console.log(`extractContent with 50 sources took ${end - start}ms`);
    expect(end - start).toBeGreaterThan(0);
  });
});
