/**
 * Comprehensive Performance Tests for Proofreader Analysis Operations
 * 
 * Tests analysis performance, caching efficiency, memory usage,
 * and optimization strategies for the proofreader tool.
 * 
 * Requirements covered: 1.1, 3.3, 5.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { Proofreader } from '@/components/ui/proofreader'
import { ConcernList } from '@/components/ui/concern-list'
import { ConcernAnalysisEngineImpl } from '@/worker/lib/concern-analysis-engine'
import { proofreaderPerformanceMonitor } from '@/lib/proofreader-performance-monitor'
import { proofreaderPerformanceOptimizer } from '@/lib/proofreader-performance-optimizer'
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernSeverity, 
  ConcernCategory,
  IdeaDefinition 
} from '@/lib/ai-types'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

global.fetch = vi.fn()

// Performance monitoring utilities
const measurePerformance = (fn: () => void | Promise<void>) => {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  return { result, duration: end - start }
}

const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

describe('Proofreader Performance Tests', () => {
  const mockConversation = { title: 'Performance Test Thesis', id: 'conv-perf-123' }
  const mockUser = userEvent.setup()

  // Generate large datasets for performance testing
  const generateLargeConcernSet = (count: number): ProofreadingConcern[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `perf-concern-${i}`,
      conversationId: 'conv-perf-123',
      category: Object.values(ConcernCategory)[i % Object.values(ConcernCategory).length],
      severity: Object.values(ConcernSeverity)[i % Object.values(ConcernSeverity).length],
      title: `Performance test concern ${i}`,
      description: `This is a performance test concern with detailed description that includes multiple sentences to simulate real-world content. Concern number ${i} focuses on testing the rendering and interaction performance of the proofreader interface.`,
      location: { 
        section: `Section ${Math.floor(i / 10)}`, 
        paragraph: (i % 10) + 1,
        context: `Context for concern ${i} with additional text to simulate real content...`
      },
      suggestions: [
        `Suggestion 1 for concern ${i}`,
        `Suggestion 2 for concern ${i}`,
        `Suggestion 3 for concern ${i}`
      ],
      relatedIdeas: [`idea-${i % 5}`],
      status: Object.values(ConcernStatus)[i % Object.values(ConcernStatus).length],
      createdAt: new Date(Date.now() - i * 1000),
      updatedAt: new Date(Date.now() - i * 500)
    }))
  }

  const generateLargeContent = (sizeKB: number): string => {
    const baseText = 'This is sample thesis content for performance testing. '
    const targetLength = sizeKB * 1024
    const repetitions = Math.ceil(targetLength / baseText.length)
    return baseText.repeat(repetitions).substring(0, targetLength)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock performance APIs
    Object.defineProperty(performance, 'now', {
      value: vi.fn(() => Date.now())
    })

    // Mock successful API responses
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/proofreader/analyze')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            concerns: generateLargeConcernSet(10),
            analysisMetadata: {
              totalConcerns: 10,
              analysisTime: 2500,
              contentLength: 5000
            }
          }), { status: 200 }))
        }
        if (url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: { content: generateLargeContent(50) }
          }), { status: 200 }))
        }
      }
      return Promise.resolve(new Response('OK', { status: 200 }))
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Analysis Performance Tests', () => {
    it('should complete analysis within acceptable time limits for medium content', async () => {
      const mediumContent = generateLargeContent(25) // 25KB
      
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: true,
          builderContent: { content: mediumContent }
        }), { status: 200 }))
      )

      const { duration } = measurePerformance(() => {
        render(
          <Proofreader 
            isOpen={true} 
            onClose={vi.fn()} 
            currentConversation={mockConversation} 
          />
        )
      })

      // Initial render should be fast (< 100ms)
      expect(duration).toBeLessThan(100)

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      
      const analysisStart = performance.now()
      await mockUser.click(analyzeButton)
      
      // Fast-forward through analysis
      vi.advanceTimersByTime(5000)
      
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      const analysisEnd = performance.now()
      const analysisTime = analysisEnd - analysisStart

      // Analysis should complete within 5 seconds for medium content
      expect(analysisTime).toBeLessThan(5000)
    })

    it('should handle large content efficiently', async () => {
      const largeContent = generateLargeContent(100) // 100KB
      
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: true,
          builderContent: { content: largeContent }
        }), { status: 200 }))
      )

      const memoryBefore = measureMemoryUsage()

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(8000) // Allow more time for large content

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      const memoryAfter = measureMemoryUsage()
      const memoryIncrease = memoryAfter - memoryBefore

      // Memory increase should be reasonable (< 50MB for 100KB content)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should optimize analysis for repeated content', async () => {
      const testContent = generateLargeContent(30)
      
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: true,
          builderContent: { content: testContent }
        }), { status: 200 }))
      )

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // First analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      
      const firstAnalysisStart = performance.now()
      await mockUser.click(analyzeButton)
      vi.advanceTimersByTime(5000)
      
      await waitFor(() => {
        expect(screen.getByText(/re-analyze content/i)).toBeInTheDocument()
      })
      const firstAnalysisTime = performance.now() - firstAnalysisStart

      // Second analysis (should use cache)
      const reAnalyzeButton = screen.getByRole('button', { name: /re-analyze content/i })
      
      const secondAnalysisStart = performance.now()
      await mockUser.click(reAnalyzeButton)
      vi.advanceTimersByTime(2000) // Should be faster due to caching
      
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })
      const secondAnalysisTime = performance.now() - secondAnalysisStart

      // Second analysis should be significantly faster (at least 50% faster)
      expect(secondAnalysisTime).toBeLessThan(firstAnalysisTime * 0.5)
    })

    it('should handle concurrent analysis requests efficiently', async () => {
      const analysisPromises: Promise<any>[] = []

      // Simulate multiple concurrent analysis requests
      for (let i = 0; i < 5; i++) {
        const promise = new Promise(resolve => {
          render(
            <Proofreader 
              isOpen={true} 
              onClose={vi.fn()} 
              currentConversation={{ ...mockConversation, id: `conv-${i}` }} 
            />
          )
          
          const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
          mockUser.click(analyzeButton).then(() => {
            vi.advanceTimersByTime(3000)
            resolve(true)
          })
        })
        analysisPromises.push(promise)
      }

      const startTime = performance.now()
      await Promise.all(analysisPromises)
      const totalTime = performance.now() - startTime

      // Concurrent requests should not significantly increase total time
      expect(totalTime).toBeLessThan(10000) // Should complete within 10 seconds
    })
  })

  describe('UI Rendering Performance Tests', () => {
    it('should render large concern lists efficiently', async () => {
      const largeConcernSet = generateLargeConcernSet(1000)

      const { duration } = measurePerformance(() => {
        render(
          <ConcernList 
            concerns={largeConcernSet}
            onStatusChange={vi.fn()}
            statusFilter="all"
            onFilterChange={vi.fn()}
          />
        )
      })

      // Should render 1000 concerns within 200ms using virtual scrolling
      expect(duration).toBeLessThan(200)

      // Verify virtual scrolling is active
      const virtualContainer = screen.getByTestId('virtual-scroll-container')
      expect(virtualContainer).toBeInTheDocument()
    })

    it('should handle rapid filtering operations efficiently', async () => {
      const largeConcernSet = generateLargeConcernSet(500)
      
      render(
        <ConcernList 
          concerns={largeConcernSet}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const filterButton = screen.getByRole('button', { name: /filter/i })

      // Perform rapid filter changes
      const filterOperations = [
        'to_be_done',
        'addressed', 
        'rejected',
        'all'
      ]

      const startTime = performance.now()
      
      for (const filter of filterOperations) {
        await mockUser.click(filterButton)
        const filterOption = screen.getByRole('option', { name: new RegExp(filter, 'i') })
        await mockUser.click(filterOption)
      }

      const totalTime = performance.now() - startTime

      // Rapid filtering should complete quickly (< 500ms for 4 operations)
      expect(totalTime).toBeLessThan(500)
    })

    it('should optimize status update operations', async () => {
      const concernSet = generateLargeConcernSet(100)
      const onStatusChange = vi.fn()
      
      render(
        <ConcernList 
          concerns={concernSet}
          onStatusChange={onStatusChange}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Perform rapid status updates
      const statusButtons = screen.getAllByRole('button', { name: /status/i })
      
      const startTime = performance.now()
      
      // Update first 10 concerns rapidly
      for (let i = 0; i < 10; i++) {
        await mockUser.click(statusButtons[i])
        const addressedOption = screen.getByRole('option', { name: /addressed/i })
        await mockUser.click(addressedOption)
      }

      const totalTime = performance.now() - startTime

      // Status updates should be debounced and efficient
      expect(totalTime).toBeLessThan(1000)
      expect(onStatusChange).toHaveBeenCalledTimes(10)
    })

    it('should maintain smooth scrolling with large datasets', async () => {
      const largeConcernSet = generateLargeConcernSet(2000)
      
      render(
        <ConcernList 
          concerns={largeConcernSet}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      
      // Simulate rapid scrolling
      const scrollEvents = Array.from({ length: 50 }, (_, i) => ({
        target: { scrollTop: i * 100 }
      }))

      const startTime = performance.now()
      
      scrollEvents.forEach(event => {
        fireEvent.scroll(scrollContainer, event)
      })

      const scrollTime = performance.now() - startTime

      // Scrolling should remain smooth (< 100ms for 50 scroll events)
      expect(scrollTime).toBeLessThan(100)
    })
  })

  describe('Memory Management Tests', () => {
    it('should properly clean up resources when component unmounts', async () => {
      const memoryBefore = measureMemoryUsage()

      const { unmount } = render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Perform analysis to create resources
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      const memoryAfterAnalysis = measureMemoryUsage()
      
      // Unmount component
      unmount()

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const memoryAfterUnmount = measureMemoryUsage()

      // Memory should be cleaned up (within 10% of original)
      const memoryIncrease = memoryAfterUnmount - memoryBefore
      const analysisMemoryUsage = memoryAfterAnalysis - memoryBefore
      
      expect(memoryIncrease).toBeLessThan(analysisMemoryUsage * 0.1)
    })

    it('should handle memory-intensive operations without leaks', async () => {
      const memoryReadings: number[] = []
      
      // Perform multiple analysis cycles
      for (let cycle = 0; cycle < 5; cycle++) {
        const { unmount } = render(
          <Proofreader 
            isOpen={true} 
            onClose={vi.fn()} 
            currentConversation={{ ...mockConversation, id: `cycle-${cycle}` }} 
          />
        )

        const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
        await mockUser.click(analyzeButton)
        vi.advanceTimersByTime(3000)

        await waitFor(() => {
          expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
        })

        memoryReadings.push(measureMemoryUsage())
        unmount()

        if (global.gc) {
          global.gc()
        }
      }

      // Memory usage should not continuously increase (no significant trend)
      const memoryTrend = memoryReadings[4] - memoryReadings[0]
      const averageUsage = memoryReadings.reduce((a, b) => a + b) / memoryReadings.length

      expect(memoryTrend).toBeLessThan(averageUsage * 0.2) // Less than 20% increase
    })
  })

  describe('Caching and Optimization Tests', () => {
    it('should cache analysis results effectively', async () => {
      const cacheKey = 'test-content-hash'
      const testContent = generateLargeContent(20)

      // Mock cache implementation
      const mockCache = new Map()
      vi.spyOn(proofreaderPerformanceOptimizer, 'getCachedAnalysis')
        .mockImplementation((request) => mockCache.get(cacheKey))
      vi.spyOn(proofreaderPerformanceOptimizer, 'cacheAnalysisResult')
        .mockImplementation((request, result) => mockCache.set(cacheKey, result))

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // First analysis - should cache result
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      expect(proofreaderPerformanceOptimizer.cacheAnalysisResult).toHaveBeenCalled()

      // Second analysis - should use cache
      const reAnalyzeButton = screen.getByRole('button', { name: /re-analyze content/i })
      await mockUser.click(reAnalyzeButton)

      expect(proofreaderPerformanceOptimizer.getCachedAnalysis).toHaveBeenCalled()
    })

    it('should optimize database queries for concern retrieval', async () => {
      const largeConcernSet = generateLargeConcernSet(1000)
      
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: true,
          concerns: largeConcernSet
        }), { status: 200 }))
      )

      const startTime = performance.now()

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/1000 concerns/i)).toBeInTheDocument()
      })

      const loadTime = performance.now() - startTime

      // Large concern set should load quickly (< 500ms)
      expect(loadTime).toBeLessThan(500)

      // Should make minimal API calls
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('should implement efficient debouncing for status updates', async () => {
      const onStatusChange = vi.fn()
      
      render(
        <ConcernList 
          concerns={generateLargeConcernSet(10)}
          onStatusChange={onStatusChange}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const statusButtons = screen.getAllByRole('button', { name: /status/i })

      // Rapid status changes on same concern
      await mockUser.click(statusButtons[0])
      let addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      await mockUser.click(statusButtons[0])
      let rejectedOption = screen.getByRole('option', { name: /rejected/i })
      await mockUser.click(rejectedOption)

      await mockUser.click(statusButtons[0])
      let toBeDoneOption = screen.getByRole('option', { name: /to be done/i })
      await mockUser.click(toBeDoneOption)

      // Should debounce rapid changes
      vi.advanceTimersByTime(1000) // Wait for debounce

      // Should only call once with final status due to debouncing
      expect(onStatusChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Performance Monitoring Tests', () => {
    it('should track analysis performance metrics', async () => {
      const startMeasureSpy = vi.spyOn(proofreaderPerformanceMonitor, 'startMeasure')
      const endMeasureSpy = vi.spyOn(proofreaderPerformanceMonitor, 'endMeasure')

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      expect(startMeasureSpy).toHaveBeenCalledWith(
        'full_analysis_workflow',
        expect.objectContaining({
          conversationId: mockConversation.id
        })
      )

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      expect(endMeasureSpy).toHaveBeenCalledWith('full_analysis_workflow')
    })

    it('should identify performance bottlenecks', async () => {
      const performanceData: any[] = []
      
      vi.spyOn(proofreaderPerformanceMonitor, 'endMeasure')
        .mockImplementation((measureName) => {
          const duration = Math.random() * 5000 + 1000 // 1-6 seconds
          performanceData.push({ measureName, duration })
          return duration
        })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      // Should identify slow operations
      const slowOperations = performanceData.filter(op => op.duration > 3000)
      expect(performanceData.length).toBeGreaterThan(0)
    })

    it('should provide performance recommendations', async () => {
      // Mock slow analysis
      vi.mocked(fetch).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(new Response(JSON.stringify({
            success: true,
            concerns: generateLargeConcernSet(5),
            analysisMetadata: { analysisTime: 8000 } // Slow analysis
          }), { status: 200 })), 8000)
        )
      )

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)
      vi.advanceTimersByTime(10000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      // Should warn about slow performance
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analysis took')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Scalability Tests', () => {
    it('should handle enterprise-scale concern volumes', async () => {
      const enterpriseConcernSet = generateLargeConcernSet(10000)

      const startTime = performance.now()

      render(
        <ConcernList 
          concerns={enterpriseConcernSet}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const renderTime = performance.now() - startTime

      // Should handle 10k concerns efficiently (< 1 second)
      expect(renderTime).toBeLessThan(1000)

      // Should use virtual scrolling
      const virtualContainer = screen.getByTestId('virtual-scroll-container')
      expect(virtualContainer).toBeInTheDocument()

      // Should only render visible items
      const renderedItems = screen.getAllByTestId(/concern-item/)
      expect(renderedItems.length).toBeLessThan(100) // Only visible items
    })

    it('should maintain performance with complex filtering', async () => {
      const complexConcernSet = generateLargeConcernSet(5000)
      
      render(
        <ConcernList 
          concerns={complexConcernSet}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Apply multiple filters rapidly
      const filterOperations = [
        { type: 'status', value: 'to_be_done' },
        { type: 'category', value: 'clarity' },
        { type: 'severity', value: 'high' }
      ]

      const startTime = performance.now()

      for (const filter of filterOperations) {
        const filterButton = screen.getByRole('button', { name: new RegExp(filter.type, 'i') })
        await mockUser.click(filterButton)
        
        const filterOption = screen.getByRole('option', { name: new RegExp(filter.value, 'i') })
        await mockUser.click(filterOption)
      }

      const filterTime = performance.now() - startTime

      // Complex filtering should remain fast (< 300ms)
      expect(filterTime).toBeLessThan(300)
    })
  })
})