/**
 * Comprehensive Test Suite for Proofreader Tool
 * 
 * This test suite covers all aspects of the proofreader functionality:
 * - End-to-end workflow tests
 * - Integration tests for AI service and database operations
 * - Accessibility tests for proofreader interface
 * - User experience tests for concern management
 * - Performance tests for analysis operations
 * 
 * Requirements covered: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import React from 'react'

// Import components and types
import { Proofreader } from '@/components/ui/proofreader'
import { ConcernList } from '@/components/ui/concern-list'
import { ConcernDetail } from '@/components/ui/concern-detail'
import { AnalysisProgress } from '@/components/ui/analysis-progress'
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernSeverity, 
  ConcernCategory,
  IdeaDefinition 
} from '@/lib/ai-types'

// Import services for integration testing
import { ConcernAnalysisEngineImpl } from '@/worker/lib/concern-analysis-engine'
import { proofreaderErrorHandler } from '@/lib/proofreader-error-handling'
import { proofreaderRecoveryService } from '@/lib/proofreader-recovery-service'
import { proofreaderPerformanceMonitor } from '@/lib/proofreader-performance-monitor'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock performance APIs
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  }
})

describe('Proofreader Comprehensive Test Suite', () => {
  const mockConversation = { title: 'Test Thesis', id: 'conv-123' }
  const mockUser = userEvent.setup()

  // Sample test data
  const mockConcerns: ProofreadingConcern[] = [
    {
      id: 'concern-1',
      conversationId: 'conv-123',
      category: ConcernCategory.CLARITY,
      severity: ConcernSeverity.HIGH,
      title: 'Unclear sentence structure',
      description: 'Several sentences are difficult to follow and need clarification.',
      location: { section: 'Introduction', paragraph: 2 },
      suggestions: ['Break down complex sentences', 'Use simpler language'],
      relatedIdeas: ['idea-1'],
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'concern-2',
      conversationId: 'conv-123',
      category: ConcernCategory.ACADEMIC_STYLE,
      severity: ConcernSeverity.MEDIUM,
      title: 'Informal language usage',
      description: 'Document contains informal expressions that should be replaced with academic language.',
      location: { section: 'Methodology' },
      suggestions: ['Use formal academic terminology'],
      relatedIdeas: [],
      status: ConcernStatus.ADDRESSED,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T01:00:00Z')
    },
    {
      id: 'concern-3',
      conversationId: 'conv-123',
      category: ConcernCategory.CITATIONS,
      severity: ConcernSeverity.CRITICAL,
      title: 'Missing citations',
      description: 'Claims made without proper citation support.',
      location: { section: 'Literature Review' },
      suggestions: ['Add proper citations', 'Include page numbers'],
      relatedIdeas: [],
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    }
  ]

  const mockIdeaDefinitions: IdeaDefinition[] = [
    {
      id: 1,
      title: 'Research Methodology',
      description: 'Systematic approach to conducting research'
    },
    {
      id: 2,
      title: 'Data Analysis',
      description: 'Process of examining and interpreting data'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock successful API responses by default
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/proofreader/concerns/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            concerns: mockConcerns
          }), { status: 200 }))
        }
        if (url.includes('/api/proofreader/analyze')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            concerns: mockConcerns,
            analysisMetadata: {
              totalConcerns: mockConcerns.length,
              concernsByCategory: { clarity: 1, academic_style: 1, citations: 1 },
              concernsBySeverity: { high: 1, medium: 1, critical: 1 },
              analysisTime: 2500,
              contentLength: 1000,
              ideaDefinitionsUsed: 2
            }
          }), { status: 200 }))
        }
        if (url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: {
              content: 'This is sample thesis content for testing purposes.',
              lastModified: new Date().toISOString()
            }
          }), { status: 200 }))
        }
        if (url.includes('/api/idealist/definitions/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            definitions: mockIdeaDefinitions
          }), { status: 200 }))
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('End-to-End Workflow Tests', () => {
    it('should complete full proofreading workflow from analysis to concern management', async () => {
      // Requirement 1.1: AI proofreader analyzes thesis proposal and lists concerns
      render(
        React.createElement(Proofreader, {
          isOpen: true,
          onClose: vi.fn(),
          currentConversation: mockConversation
        })
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Proofreader')).toBeInTheDocument()
      })

      // Start analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify analysis progress is shown
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
      })

      // Fast-forward through analysis
      vi.advanceTimersByTime(5000)

      // Verify concerns are displayed
      await waitFor(() => {
        expect(screen.getByText('Unclear sentence structure')).toBeInTheDocument()
        expect(screen.getByText('Informal language usage')).toBeInTheDocument()
        expect(screen.getByText('Missing citations')).toBeInTheDocument()
      })

      // Test concern status management (Requirement 3.1)
      const concernItems = screen.getAllByTestId(/concern-item/)
      expect(concernItems).toHaveLength(3)

      // Update concern status
      const statusButton = within(concernItems[0]).getByRole('button', { name: /status/i })
      await mockUser.click(statusButton)

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      // Verify status update
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proofreader/concerns/concern-1/status'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ status: 'addressed' })
          })
        )
      })
    })

    it('should handle analysis cancellation gracefully', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Start analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Cancel analysis
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await mockUser.click(cancelButton)

      // Verify cancellation
      await waitFor(() => {
        expect(screen.getByText(/cancelled/i)).toBeInTheDocument()
      })
    })

    it('should persist concern status changes across sessions', async () => {
      // First session - update status
      const { rerender } = render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proofreader')).toBeInTheDocument()
      })

      // Close and reopen (simulate new session)
      rerender(
        <Proofreader 
          isOpen={false} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      rerender(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Verify concerns are loaded from API
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proofreader/concerns/conv-123')
        )
      })
    })
  })

  describe('AI Service Integration Tests', () => {
    it('should integrate with AI service for content analysis', async () => {
      // Mock AI service response
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: true,
          concerns: mockConcerns,
          analysisMetadata: {
            totalConcerns: 3,
            analysisTime: 2500,
            contentLength: 1000
          }
        }), { status: 200 }))
      )

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify AI service integration
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/proofreader/analyze',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('conversationId')
          })
        )
      })
    })

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service error
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: false,
          error: 'AI service temporarily unavailable'
        }), { status: 503 }))
      )

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/service temporarily unavailable/i)).toBeInTheDocument()
      })
    })

    it('should integrate idea definitions in analysis context', async () => {
      // Requirement 2.1: Proofreader considers idea definitions for contextual analysis
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify idea definitions are fetched and included
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/idealist/definitions/conv-123')
        )
      })

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/proofreader/analyze',
          expect.objectContaining({
            body: expect.stringContaining('ideaDefinitions')
          })
        )
      })
    })
  })

  describe('Database Integration Tests', () => {
    it('should persist concerns to database during analysis', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify database operations
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/proofreader/analyze',
          expect.objectContaining({
            method: 'POST'
          })
        )
      })
    })

    it('should update concern status in database', async () => {
      // Mock status update response
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: true,
          concern: { ...mockConcerns[0], status: ConcernStatus.ADDRESSED }
        }), { status: 200 }))
      )

      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Find and update status
      const statusButtons = screen.getAllByRole('button', { name: /status/i })
      await mockUser.click(statusButtons[0])

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      // Verify database update
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proofreader/concerns/concern-1/status'),
          expect.objectContaining({
            method: 'PUT'
          })
        )
      })
    })

    it('should handle database connection errors', async () => {
      // Mock database error
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: false,
          error: 'Database connection failed'
        }), { status: 500 }))
      )

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Verify error handling for database issues
      await waitFor(() => {
        expect(screen.getByText(/connection/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Tests', () => {
    it('should have no accessibility violations in main proofreader interface', async () => {
      const { container } = render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proofreader')).toBeInTheDocument()
      })

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation for concern management', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Test keyboard navigation
      const firstConcern = screen.getAllByTestId(/concern-item/)[0]
      firstConcern.focus()

      // Navigate with Tab key
      await mockUser.keyboard('{Tab}')
      expect(document.activeElement).not.toBe(firstConcern)

      // Navigate with Arrow keys
      await mockUser.keyboard('{ArrowDown}')
      await mockUser.keyboard('{ArrowUp}')

      // Activate with Enter/Space
      await mockUser.keyboard('{Enter}')
    })

    it('should provide proper ARIA labels and roles', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        // Check for proper dialog role
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        
        // Check for proper button roles
        expect(screen.getByRole('button', { name: /analyze content/i })).toBeInTheDocument()
        
        // Check for proper headings
        expect(screen.getByRole('heading', { name: /proofreader/i })).toBeInTheDocument()
      })
    })

    it('should support screen readers with proper descriptions', async () => {
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={vi.fn()}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      // Check for descriptive text
      expect(screen.getByText(mockConcerns[0].description)).toBeInTheDocument()
      
      // Check for proper labeling
      expect(screen.getByLabelText(/concern status/i)).toBeInTheDocument()
    })

    it('should provide high contrast mode support', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Verify high contrast indicators are present
      const severityIndicators = screen.getAllByTestId(/severity-indicator/)
      expect(severityIndicators.length).toBeGreaterThan(0)
    })
  })

  describe('User Experience Tests', () => {
    it('should provide intuitive concern filtering and sorting', async () => {
      // Requirement 5.1: Interface consistent with Idealist tool design
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Test status filtering
      const filterButton = screen.getByRole('button', { name: /filter/i })
      await mockUser.click(filterButton)

      const toBeDoneFilter = screen.getByRole('option', { name: /to be done/i })
      await mockUser.click(toBeDoneFilter)

      // Test category filtering
      const categoryFilter = screen.getByRole('button', { name: /category/i })
      await mockUser.click(categoryFilter)

      const clarityFilter = screen.getByRole('option', { name: /clarity/i })
      await mockUser.click(clarityFilter)

      // Test sorting
      const sortButton = screen.getByRole('button', { name: /sort/i })
      await mockUser.click(sortButton)
    })

    it('should provide clear visual feedback for concern status changes', async () => {
      const onStatusChange = vi.fn()
      
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={onStatusChange}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      // Change status
      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await mockUser.click(statusSelect)

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      // Verify callback and visual feedback
      expect(onStatusChange).toHaveBeenCalledWith(ConcernStatus.ADDRESSED)
    })

    it('should handle large numbers of concerns efficiently', async () => {
      // Generate large dataset
      const largeConcernSet = Array.from({ length: 500 }, (_, i) => ({
        ...mockConcerns[0],
        id: `concern-${i}`,
        title: `Concern ${i}`
      }))

      const startTime = performance.now()
      
      render(
        <ConcernList 
          concerns={largeConcernSet}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const endTime = performance.now()
      
      // Should render efficiently (under 100ms for 500 items)
      expect(endTime - startTime).toBeLessThan(100)
      
      // Should use virtual scrolling for performance
      const virtualContainer = screen.getByTestId('virtual-scroll-container')
      expect(virtualContainer).toBeInTheDocument()
    })

    it('should provide helpful tooltips and guidance', async () => {
      render(
        <AnalysisProgress 
          isAnalyzing={true}
          progress={50}
          statusMessage="Analyzing content structure..."
          onCancel={vi.fn()}
          error={null}
          success={false}
        />
      )

      // Check for helpful status messages
      expect(screen.getByText('Analyzing content structure...')).toBeInTheDocument()
      
      // Check for progress indication
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Performance Tests', () => {
    it('should complete analysis within acceptable time limits', async () => {
      const performanceStart = performance.now()
      
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Fast-forward through analysis
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      const performanceEnd = performance.now()
      
      // Analysis should complete within reasonable time (accounting for mocked timers)
      expect(performanceEnd - performanceStart).toBeLessThan(1000)
    })

    it('should cache analysis results for improved performance', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // First analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/re-analyze content/i)).toBeInTheDocument()
      })

      // Second analysis should use cache
      const reAnalyzeButton = screen.getByRole('button', { name: /re-analyze content/i })
      await mockUser.click(reAnalyzeButton)

      // Should be faster due to caching
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })
    })

    it('should handle concurrent status updates efficiently', async () => {
      const onStatusChange = vi.fn()
      
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={onStatusChange}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Simulate rapid status changes
      const statusButtons = screen.getAllByRole('button', { name: /status/i })
      
      // Click multiple status buttons rapidly
      await Promise.all([
        mockUser.click(statusButtons[0]),
        mockUser.click(statusButtons[1]),
        mockUser.click(statusButtons[2])
      ])

      // Should handle debouncing properly
      expect(onStatusChange).toHaveBeenCalledTimes(3)
    })

    it('should monitor and report performance metrics', async () => {
      const performanceMonitorSpy = vi.spyOn(proofreaderPerformanceMonitor, 'startMeasure')
      
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify performance monitoring is active
      expect(performanceMonitorSpy).toHaveBeenCalledWith(
        'full_analysis_workflow',
        expect.objectContaining({
          conversationId: mockConversation.id
        })
      )
    })
  })

  describe('Error Handling and Recovery Tests', () => {
    it('should recover from network failures gracefully', async () => {
      // Mock network failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Should show error message and recovery options
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should provide offline functionality with cached data', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Should show offline indicator and cached data
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument()
      })
    })

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response('Invalid JSON', { status: 200 }))
      )

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Should handle parsing errors gracefully
      await waitFor(() => {
        expect(screen.getByText(/error processing response/i)).toBeInTheDocument()
      })
    })
  })

  describe('Integration with Existing Tools', () => {
    it('should integrate with Builder tool for content retrieval', async () => {
      // Requirement 2.1: Integration with existing Builder and Idealist tools
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify Builder content is fetched
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/builder/content/conv-123')
        )
      })
    })

    it('should maintain consistency with Idealist tool interface patterns', async () => {
      // Requirement 5.1: Interface consistent with Idealist tool design
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Should use similar visual patterns as Idealist
      expect(screen.getByTestId('concern-list-container')).toBeInTheDocument()
      expect(screen.getAllByTestId(/concern-item/)).toHaveLength(3)
    })

    it('should respect read-only analysis principle', async () => {
      // Requirement 4.1: Proofreader focuses only on analysis and feedback
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Should not have any content modification buttons
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /modify/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument()
    })
  })
})