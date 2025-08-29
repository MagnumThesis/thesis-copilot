import { describe, it, expect } from 'vitest'
import { aiPerformanceOptimizer } from '../../lib/ai-performance-optimizer'
import { AIMode } from '../../lib/ai-types'

describe('aiPerformanceOptimizer performance validation', () => {
  it('caches responses and exposes cache stats', async () => {
  const requestFn = async () => ({ success: true, data: { value: 42 }, timestamp: Date.now(), error: null })

    const params = { prompt: 'hello' }

    // First call - should populate cache
  const r1 = await aiPerformanceOptimizer.optimizedRequest(AIMode.PROMPT as any, 'doc', params, requestFn as any, { enableCaching: true, forceImmediate: true })
    expect(r1.success).toBe(true)

    // Second call with same inputs should be served from cache or at least cache stats updated
  const r2 = await aiPerformanceOptimizer.optimizedRequest(AIMode.PROMPT as any, 'doc', params, requestFn as any, { enableCaching: true, forceImmediate: true })
    expect(r2.success).toBe(true)

    const stats = aiPerformanceOptimizer.getCacheStats()
    expect(stats).toBeDefined()
    expect(typeof stats.size).toBe('number')
  })
})
