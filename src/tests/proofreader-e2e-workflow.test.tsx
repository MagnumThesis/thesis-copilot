/**
 * End-to-End Tests for Complete Proofreader Workflow
 * 
 * Tests the complete user journey from opening the proofreader tool
 * to analyzing content and managing concerns.
 * 
 * Requirements covered: 1.1, 1.3, 1.4, 3.1, 3.2, 3.3, 4.1, 5.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { Proofreader } from '@/components/ui/proofreader'
import { ToolsPanel } from '@/components/ui/tools-panel'
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernSeverity, 
  ConcernCategory 
} from '@/lib/ai-types'

// Mock toast notifications
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

describe('Proofreader End-to-End Workflow Tests', () => {
  const mockConversation = { title: 'My Thesis Proposal', id: 'conv-e2e-123' }
  const mockUser = userEvent.setup()

  const mockThesisContent = `
    # Introduction
    This research aims to investigate the impact of artificial intelligence on educational outcomes.
    The study will examine how AI technologies can enhance learning experiences.
    
    # Literature Review
    Previous research shows that technology improves education.
    Studies indicate positive results but more research is needed.
    
    # Methodology
    We will use surveys and interviews to collect data.
    The approach will be qualitative and quantitative.
  `

  const mockAnalysisResponse = {
    success: true,
    concerns: [
      {
        id: 'e2e-concern-1',
        conversationId: 'conv-e2e-123',
        category: ConcernCategory.CITATIONS,
        severity: ConcernSeverity.HIGH,
        title: 'Missing citations in literature review',
        description: 'Claims about previous research lack proper citation support.',
        location: { section: 'Literature Review', paragraph: 1 },
        suggestions: ['Add specific citations for research claims', 'Include page numbers for direct references'],
        relatedIdeas: [],
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'e2e-concern-2',
        conversationId: 'conv-e2e-123',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.MEDIUM,
        title: 'Vague methodology description',
        description: 'The methodology section lacks specific details about data collection procedures.',
        location: { section: 'Methodology', paragraph: 2 },
        suggestions: ['Specify sample size and selection criteria', 'Detail data collection procedures'],
        relatedIdeas: [],
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'e2e-concern-3',
        conversationId: 'conv-e2e-123',
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.CRITICAL,
        title: 'Missing research questions',
        description: 'The proposal lacks clearly defined research questions.',
        location: { section: 'Introduction' },
        suggestions: ['Add specific research questions', 'Align questions with methodology'],
        relatedIdeas: [],
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }
    ],
    analysisMetadata: {
      totalConcerns: 3,
      concernsByCategory: {
        citations: 1,
        clarity: 1,
        completeness: 1
      },
      concernsBySeverity: {
        critical: 1,
        high: 1,
        medium: 1
      },
      analysisTime: 3200,
      contentLength: mockThesisContent.length,
      ideaDefinitionsUsed: 0
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock API responses
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: {
              content: mockThesisContent,
              lastModified: new Date().toISOString()
            }
          }), { status: 200 }))
        }
        if (url.includes('/api/idealist/definitions/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            definitions: []
          }), { status: 200 }))
        }
        if (url.includes('/api/proofreader/analyze')) {
          return Promise.resolve(new Response(JSON.stringify(mockAnalysisResponse), { status: 200 }))
        }
        if (url.includes('/api/proofreader/concerns/')) {
          if (url.includes('/status')) {
            // Status update endpoint
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              concern: { ...mockAnalysisResponse.concerns[0], status: ConcernStatus.ADDRESSED }
            }), { status: 200 }))
          } else {
            // Get concerns endpoint
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              concerns: mockAnalysisResponse.concerns
            }), { status: 200 }))
          }
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllTimers()
  })

  describe('Complete User Journey', () => {
    it('should complete full workflow: open tool → analyze → review concerns → manage status', async () => {
      // Step 1: Open proofreader tool from tools panel
      render(
        <ToolsPanel currentConversation={mockConversation} />
      )

      const proofreaderCard = screen.getByText('Proofreader')
      await mockUser.click(proofreaderCard)

      // Verify proofreader sheet opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('AI-powered proofreading analysis')).toBeInTheDocument()
      })

      // Step 2: Initiate content analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      expect(analyzeButton).toBeInTheDocument()
      
      await mockUser.click(analyzeButton)

      // Verify analysis starts
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
      })

      // Step 3: Wait for analysis progress
      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })

      // Step 4: Complete analysis
      vi.advanceTimersByTime(4000)
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      // Step 5: Review generated concerns
      await waitFor(() => {
        expect(screen.getByText('Missing citations in literature review')).toBeInTheDocument()
        expect(screen.getByText('Vague methodology description')).toBeInTheDocument()
        expect(screen.getByText('Missing research questions')).toBeInTheDocument()
      })

      // Verify concern details are displayed
      expect(screen.getByText('Claims about previous research lack proper citation support.')).toBeInTheDocument()

      // Step 6: Expand concern for detailed view
      const firstConcern = screen.getByText('Missing citations in literature review')
      await mockUser.click(firstConcern)

      await waitFor(() => {
        expect(screen.getByText('Add specific citations for research claims')).toBeInTheDocument()
        expect(screen.getByText('Include page numbers for direct references')).toBeInTheDocument()
      })

      // Step 7: Update concern status
      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await mockUser.click(statusSelect)

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      // Verify status update API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proofreader/concerns/e2e-concern-1/status'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ status: 'addressed' })
          })
        )
      })

      // Step 8: Filter concerns by status
      const filterButton = screen.getByRole('button', { name: /filter/i })
      await mockUser.click(filterButton)

      const toBeDoneFilter = screen.getByRole('option', { name: /to be done/i })
      await mockUser.click(toBeDoneFilter)

      // Verify filtering works
      await waitFor(() => {
        expect(screen.getByText('Vague methodology description')).toBeInTheDocument()
        expect(screen.getByText('Missing research questions')).toBeInTheDocument()
      })

      // Step 9: View analysis statistics
      expect(screen.getByText(/3 concerns found/i)).toBeInTheDocument()
      expect(screen.getByText(/critical: 1/i)).toBeInTheDocument()
      expect(screen.getByText(/high: 1/i)).toBeInTheDocument()
    })

    it('should handle re-analysis workflow after content changes', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Initial analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/re-analyze content/i)).toBeInTheDocument()
      })

      // Re-analyze with updated content
      const reAnalyzeButton = screen.getByRole('button', { name: /re-analyze content/i })
      await mockUser.click(reAnalyzeButton)

      // Verify re-analysis process
      await waitFor(() => {
        expect(screen.getByText(/analyzing/i)).toBeInTheDocument()
      })

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })
    })

    it('should persist concern status across sessions', async () => {
      // First session - update concern status
      const { rerender } = render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Missing citations in literature review')).toBeInTheDocument()
      })

      // Update status
      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await mockUser.click(statusSelect)

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

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

      // Verify status is persisted
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proofreader/concerns/conv-e2e-123')
        )
      })
    })
  })

  describe('Analysis Progress and Feedback', () => {
    it('should show detailed progress during analysis', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Check progress stages
      await waitFor(() => {
        expect(screen.getByText(/retrieving content/i)).toBeInTheDocument()
      })

      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText(/analyzing structure/i)).toBeInTheDocument()
      })

      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText(/checking citations/i)).toBeInTheDocument()
      })

      vi.advanceTimersByTime(1000)
      await waitFor(() => {
        expect(screen.getByText(/validating style/i)).toBeInTheDocument()
      })

      vi.advanceTimersByTime(2000)
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })
    })

    it('should allow analysis cancellation at any stage', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Cancel during progress
      vi.advanceTimersByTime(2000)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await mockUser.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText(/analysis cancelled/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /analyze content/i })).toBeInTheDocument()
      })
    })

    it('should show analysis metadata and statistics', async () => {
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
        expect(screen.getByText(/3 concerns found/i)).toBeInTheDocument()
        expect(screen.getByText(/analysis completed in/i)).toBeInTheDocument()
        expect(screen.getByText(/content length:/i)).toBeInTheDocument()
      })

      // Check category breakdown
      expect(screen.getByText(/citations: 1/i)).toBeInTheDocument()
      expect(screen.getByText(/clarity: 1/i)).toBeInTheDocument()
      expect(screen.getByText(/completeness: 1/i)).toBeInTheDocument()

      // Check severity breakdown
      expect(screen.getByText(/critical: 1/i)).toBeInTheDocument()
      expect(screen.getByText(/high: 1/i)).toBeInTheDocument()
      expect(screen.getByText(/medium: 1/i)).toBeInTheDocument()
    })
  })

  describe('Concern Management Workflow', () => {
    it('should support bulk concern status updates', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Missing citations in literature review')).toBeInTheDocument()
      })

      // Select multiple concerns
      const checkboxes = screen.getAllByRole('checkbox')
      await mockUser.click(checkboxes[0])
      await mockUser.click(checkboxes[1])

      // Bulk status update
      const bulkActionButton = screen.getByRole('button', { name: /bulk actions/i })
      await mockUser.click(bulkActionButton)

      const markAddressedOption = screen.getByRole('menuitem', { name: /mark as addressed/i })
      await mockUser.click(markAddressedOption)

      // Verify bulk update
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2) // Two status updates
      })
    })

    it('should provide concern sorting and organization', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Missing research questions')).toBeInTheDocument()
      })

      // Sort by severity (critical first)
      const sortButton = screen.getByRole('button', { name: /sort/i })
      await mockUser.click(sortButton)

      const severitySort = screen.getByRole('menuitem', { name: /severity/i })
      await mockUser.click(severitySort)

      // Verify critical concern appears first
      const concernItems = screen.getAllByTestId(/concern-item/)
      const firstConcern = within(concernItems[0]).getByText('Missing research questions')
      expect(firstConcern).toBeInTheDocument()
    })

    it('should show concern location and context', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Missing citations in literature review')).toBeInTheDocument()
      })

      // Expand concern to see location
      const concernTitle = screen.getByText('Missing citations in literature review')
      await mockUser.click(concernTitle)

      await waitFor(() => {
        expect(screen.getByText(/literature review, paragraph 1/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling in Workflow', () => {
    it('should handle content retrieval failures gracefully', async () => {
      // Mock content retrieval failure
      vi.mocked(fetch).mockImplementationOnce((url) => {
        if (typeof url === 'string' && url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: false,
            error: 'Content not found'
          }), { status: 404 }))
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
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

      await waitFor(() => {
        expect(screen.getByText(/content not found/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should handle analysis service failures with recovery options', async () => {
      // Mock analysis failure
      vi.mocked(fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/proofreader/analyze')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: false,
              error: 'Analysis service temporarily unavailable'
            }), { status: 503 }))
          }
          // Other endpoints work normally
          if (url.includes('/api/builder/content/')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              builderContent: { content: mockThesisContent }
            }), { status: 200 }))
          }
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
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

      await waitFor(() => {
        expect(screen.getByText(/service temporarily unavailable/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should handle network interruptions during status updates', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Missing citations in literature review')).toBeInTheDocument()
      })

      // Mock network failure for status update
      vi.mocked(fetch).mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      )

      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await mockUser.click(statusSelect)

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      await waitFor(() => {
        expect(screen.getByText(/failed to update status/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })

  describe('Integration with Builder Tool', () => {
    it('should retrieve and analyze current Builder content', async () => {
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
          expect.stringContaining('/api/builder/content/conv-e2e-123')
        )
      })

      // Verify content is analyzed
      vi.advanceTimersByTime(5000)
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/proofreader/analyze',
          expect.objectContaining({
            body: expect.stringContaining(mockThesisContent.substring(0, 50))
          })
        )
      })
    })

    it('should handle empty or insufficient Builder content', async () => {
      // Mock empty content
      vi.mocked(fetch).mockImplementationOnce((url) => {
        if (typeof url === 'string' && url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: { content: '' }
          }), { status: 200 }))
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
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

      await waitFor(() => {
        expect(screen.getByText(/insufficient content/i)).toBeInTheDocument()
        expect(screen.getByText(/add more content in builder/i)).toBeInTheDocument()
      })
    })
  })
})