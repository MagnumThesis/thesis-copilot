import { GoogleScholarClient, SearchOptions } from '../worker/lib/google-scholar-client';
import { aiSearcherPerformanceOptimizer } from '../lib/ai-searcher-performance-optimizer';
import { ScholarSearchResult } from '../lib/ai-types';
import { vi } from 'vitest';

// Mock the fetchSearchResults method
const mockFetch = vi.fn();

describe('GoogleScholarClient Caching', () => {
  let client: GoogleScholarClient;

  beforeEach(() => {
    client = new GoogleScholarClient({ maxRetries: 1 }, { enabled: false });
    // Mock the private fetchSearchResults method
    (client as any).fetchSearchResults = mockFetch;
    aiSearcherPerformanceOptimizer.clearAllCaches();
    mockFetch.mockClear();
  });

  it('should cache search results and return cached results on subsequent calls', async () => {
    const query = 'test query';
    const options: SearchOptions = { maxResults: 10 };
    const mockHtml = `
      <div class="gs_r gs_or gs_scl">
        <h3 class="gs_rt"><a href="http://example.com">Test Title</a></h3>
        <div class="gs_a">Test Author - Test Journal, 2023 - example.com</div>
        <div class="gs_rs">This is a test abstract.</div>
      </div>
    `;
    mockFetch.mockResolvedValue(mockHtml);

    // First call - should fetch and cache
    const results1 = await client.search(query, options);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(results1.length).toBe(1);
    expect(results1[0].title).toBe('Test Title');

    // Second call - should return cached results
    const results2 = await client.search(query, options);

    expect(mockFetch).toHaveBeenCalledTimes(1); // Should not be called again
    expect(results2.length).toBe(1);
    expect(results2[0].title).toBe('Test Title');
    expect(results2).toEqual(results1);
  });

  it('should not cache failed searches', async () => {
    const query = 'failing query';
    const options: SearchOptions = { maxResults: 10 };
    mockFetch.mockRejectedValue(new Error('Network error'));

    // First call - should fail
    await expect(client.search(query, options)).rejects.toThrow();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call - should try to fetch again
    mockFetch.mockResolvedValue(`
      <div class="gs_r gs_or gs_scl">
        <h3 class="gs_rt"><a href="http://example.com">Test Title</a></h3>
        <div class="gs_a">Test Author - Test Journal, 2023 - example.com</div>
        <div class="gs_rs">This is a test abstract.</div>
      </div>
    `);
    const results = await client.search(query, options);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(results.length).toBe(1);
  });
});
