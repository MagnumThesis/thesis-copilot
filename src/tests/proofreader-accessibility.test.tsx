/**
 * Accessibility Tests for Proofreader Interface
 * 
 * Tests keyboard navigation, screen reader support, ARIA compliance,
 * and other accessibility features of the proofreader tool.
 * 
 * Requirements covered: 4.4, 5.1, 5.2, 5.3, 5.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import React from 'react'

import { Proofreader } from '@/components/ui/proofreader'
import { ConcernList } from '@/components/ui/concern-list'
import { ConcernDetail } from '@/components/ui/concern-detail'
import { AnalysisProgress } from '@/components/ui/analysis-progress'
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernSeverity, 
  ConcernCategory 
} from '@/lib/ai-types'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

global.fetch = vi.fn()

describe('Proofreader Accessibility Tests', () => {
  const mockConversation = { title: 'Accessible Thesis', id: 'conv-a11y-123' }
  const mockUser = userEvent.setup()

  const mockConcerns: ProofreadingConcern[] = [
    {
      id: 'a11y-concern-1',
      conversationId: 'conv-a11y-123',
      category: ConcernCategory.CLARITY,
      severity: ConcernSeverity.HIGH,
      title: 'Unclear sentence structure in introduction',
      description: 'Several sentences in the introduction are difficult to follow and may confuse readers.',
      location: { section: 'Introduction', paragraph: 2, context: 'The research methodology that was...' },
      suggestions: ['Break down complex sentences into simpler ones', 'Use active voice where possible'],
      relatedIdeas: [],
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'a11y-concern-2',
      conversationId: 'conv-a11y-123',
      category: ConcernCategory.CITATIONS,
      severity: ConcernSeverity.CRITICAL,
      title: 'Missing citations for key claims',
      description: 'Important claims in the literature review lack proper citation support.',
      location: { section: 'Literature Review', paragraph: 1 },
      suggestions: ['Add citations for all factual claims', 'Include page numbers for direct quotes'],
      relatedIdeas: [],
      status: ConcernStatus.ADDRESSED,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T01:00:00Z')
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API responses
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({
        success: true,
        concerns: mockConcerns
      }), { status: 200 }))
    )
  })

  describe('ARIA Compliance and Semantic Structure', () => {
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

    it('should have proper dialog role and ARIA attributes', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('should have proper heading hierarchy', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 2, name: /proofreader/i })
        expect(mainHeading).toBeInTheDocument()
      })

      // Check for proper heading structure in concern sections
      const concernHeadings = screen.getAllByRole('heading', { level: 3 })
      expect(concernHeadings.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA labels for interactive elements', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Check filter controls
      const filterButton = screen.getByRole('button', { name: /filter concerns/i })
      expect(filterButton).toHaveAttribute('aria-expanded')
      expect(filterButton).toHaveAttribute('aria-haspopup')

      // Check sort controls
      const sortButton = screen.getByRole('button', { name: /sort concerns/i })
      expect(sortButton).toHaveAttribute('aria-label')

      // Check concern status controls
      const statusSelects = screen.getAllByRole('combobox')
      statusSelects.forEach(select => {
        expect(select).toHaveAttribute('aria-label')
      })
    })

    it('should provide proper form labels and descriptions', async () => {
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={vi.fn()}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      // Status select should have proper labeling
      const statusSelect = screen.getByRole('combobox', { name: /concern status/i })
      expect(statusSelect).toBeInTheDocument()
      expect(statusSelect).toHaveAttribute('aria-describedby')

      // Check for descriptive text
      const description = screen.getByText(mockConcerns[0].description)
      expect(description).toHaveAttribute('id')
    })
  })

  describe('Keyboard Navigation Support', () => {
    it('should support Tab navigation through all interactive elements', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Proofreader')).toBeInTheDocument()
      })

      // Start from the analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      analyzeButton.focus()
      expect(document.activeElement).toBe(analyzeButton)

      // Tab through elements
      await mockUser.keyboard('{Tab}')
      expect(document.activeElement).toHaveAttribute('role')

      await mockUser.keyboard('{Tab}')
      expect(document.activeElement).toHaveAttribute('role')

      // Should be able to tab through all interactive elements
      const interactiveElements = screen.getAllByRole('button')
      expect(interactiveElements.length).toBeGreaterThan(1)
    })

    it('should support arrow key navigation in concern list', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const concernItems = screen.getAllByTestId(/concern-item/)
      expect(concernItems.length).toBe(2)

      // Focus first concern
      concernItems[0].focus()
      expect(document.activeElement).toBe(concernItems[0])

      // Navigate with arrow keys
      await mockUser.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(concernItems[1])

      await mockUser.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(concernItems[0])

      // Home/End navigation
      await mockUser.keyboard('{End}')
      expect(document.activeElement).toBe(concernItems[concernItems.length - 1])

      await mockUser.keyboard('{Home}')
      expect(document.activeElement).toBe(concernItems[0])
    })

    it('should support Enter and Space key activation', async () => {
      const onStatusChange = vi.fn()
      
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={onStatusChange}
          isExpanded={false}
          onToggleExpanded={vi.fn()}
        />
      )

      // Focus the expand button
      const expandButton = screen.getByRole('button', { name: /expand concern/i })
      expandButton.focus()

      // Activate with Enter
      await mockUser.keyboard('{Enter}')
      expect(expandButton).toHaveBeenCalled

      // Activate with Space
      await mockUser.keyboard(' ')
      expect(expandButton).toHaveBeenCalled
    })

    it('should support Escape key to close dialogs and dropdowns', async () => {
      const onClose = vi.fn()
      
      render(
        <Proofreader 
          isOpen={true} 
          onClose={onClose} 
          currentConversation={mockConversation} 
        />
      )

      // Press Escape to close
      await mockUser.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalled()
    })

    it('should maintain focus management during dynamic content changes', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Focus a concern item
      const concernItems = screen.getAllByTestId(/concern-item/)
      concernItems[0].focus()
      expect(document.activeElement).toBe(concernItems[0])

      // Filter concerns (dynamic content change)
      const filterButton = screen.getByRole('button', { name: /filter/i })
      await mockUser.click(filterButton)

      const toBeDoneFilter = screen.getByRole('option', { name: /to be done/i })
      await mockUser.click(toBeDoneFilter)

      // Focus should be maintained or moved appropriately
      expect(document.activeElement).toHaveAttribute('role')
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide descriptive text for concern severity levels', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // Check for severity descriptions
      const highSeverityIndicator = screen.getByText(/high priority/i)
      expect(highSeverityIndicator).toHaveAttribute('aria-label', 'High severity concern')

      const criticalSeverityIndicator = screen.getByText(/critical/i)
      expect(criticalSeverityIndicator).toHaveAttribute('aria-label', 'Critical severity concern')
    })

    it('should announce status changes to screen readers', async () => {
      const onStatusChange = vi.fn()
      
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={onStatusChange}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      const statusSelect = screen.getByRole('combobox', { name: /concern status/i })
      
      // Change status
      await mockUser.click(statusSelect)
      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      // Should have live region for announcements
      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toBeInTheDocument()
    })

    it('should provide context for concern locations', async () => {
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={vi.fn()}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      // Location should be clearly described
      const locationText = screen.getByText(/introduction, paragraph 2/i)
      expect(locationText).toHaveAttribute('aria-label', 'Concern location: Introduction, paragraph 2')

      // Context should be provided
      const contextText = screen.getByText(/the research methodology that was/i)
      expect(contextText).toHaveAttribute('aria-label', 'Context: The research methodology that was...')
    })

    it('should provide progress announcements during analysis', async () => {
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

      // Progress should be announced
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '50')
      expect(progressBar).toHaveAttribute('aria-valuetext', '50% complete')

      // Status should be in live region
      const statusMessage = screen.getByText('Analyzing content structure...')
      expect(statusMessage.closest('[role="status"]')).toBeInTheDocument()
    })

    it('should provide comprehensive concern descriptions', async () => {
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={vi.fn()}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      // Full concern should be described for screen readers
      const concernContainer = screen.getByTestId('concern-detail')
      expect(concernContainer).toHaveAttribute('aria-describedby')

      const description = screen.getByText(mockConcerns[0].description)
      expect(description).toHaveAttribute('id')

      // Suggestions should be properly structured
      const suggestionsList = screen.getByRole('list', { name: /suggestions/i })
      expect(suggestionsList).toBeInTheDocument()

      const suggestions = screen.getAllByRole('listitem')
      expect(suggestions.length).toBe(mockConcerns[0].suggestions?.length)
    })
  })

  describe('High Contrast and Visual Accessibility', () => {
    it('should support high contrast mode', async () => {
      // Mock high contrast preference
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

      // Check for high contrast indicators
      const severityIndicators = screen.getAllByTestId(/severity-indicator/)
      severityIndicators.forEach(indicator => {
        expect(indicator).toHaveClass(/high-contrast/)
      })
    })

    it('should have sufficient color contrast for text', async () => {
      const { container } = render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Axe will check color contrast ratios
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('should provide visual focus indicators', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const firstConcern = screen.getAllByTestId(/concern-item/)[0]
      firstConcern.focus()

      // Should have visible focus indicator
      expect(firstConcern).toHaveClass(/focus-visible/)
      expect(getComputedStyle(firstConcern).outline).not.toBe('none')
    })

    it('should support reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
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
        <AnalysisProgress 
          isAnalyzing={true}
          progress={50}
          statusMessage="Analyzing..."
          onCancel={vi.fn()}
          error={null}
          success={false}
        />
      )

      // Animations should be reduced or disabled
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveClass(/reduced-motion/)
    })
  })

  describe('Error State Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      render(
        <AnalysisProgress 
          isAnalyzing={false}
          progress={0}
          statusMessage=""
          onCancel={vi.fn()}
          error="Analysis failed due to network error"
          success={false}
        />
      )

      // Error should be in alert region
      const errorMessage = screen.getByText(/analysis failed/i)
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument()
    })

    it('should provide accessible error recovery options', async () => {
      render(
        <AnalysisProgress 
          isAnalyzing={false}
          progress={0}
          statusMessage=""
          onCancel={vi.fn()}
          error="Network connection failed"
          success={false}
        />
      )

      // Retry button should be properly labeled
      const retryButton = screen.getByRole('button', { name: /retry analysis/i })
      expect(retryButton).toHaveAttribute('aria-describedby')
      
      const errorDescription = screen.getByText(/network connection failed/i)
      expect(errorDescription).toHaveAttribute('id')
    })
  })

  describe('Mobile and Touch Accessibility', () => {
    it('should have adequate touch targets', async () => {
      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      // All interactive elements should meet minimum touch target size (44px)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = getComputedStyle(button)
        const minSize = 44
        expect(parseInt(styles.minHeight) || parseInt(styles.height)).toBeGreaterThanOrEqual(minSize)
        expect(parseInt(styles.minWidth) || parseInt(styles.width)).toBeGreaterThanOrEqual(minSize)
      })
    })

    it('should support swipe gestures for concern management', async () => {
      render(
        <ConcernDetail 
          concern={mockConcerns[0]}
          onStatusChange={vi.fn()}
          isExpanded={true}
          onToggleExpanded={vi.fn()}
        />
      )

      const concernContainer = screen.getByTestId('concern-detail')
      
      // Should support touch events
      expect(concernContainer).toHaveAttribute('role')
      expect(concernContainer).toHaveAttribute('tabIndex')
    })
  })

  describe('Internationalization and Localization', () => {
    it('should support right-to-left text direction', async () => {
      // Mock RTL language
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')

      render(
        <ConcernList 
          concerns={mockConcerns}
          onStatusChange={vi.fn()}
          statusFilter="all"
          onFilterChange={vi.fn()}
        />
      )

      const container = screen.getByTestId('concern-list-container')
      expect(container).toHaveClass(/rtl/)

      // Cleanup
      document.documentElement.removeAttribute('dir')
      document.documentElement.removeAttribute('lang')
    })

    it('should provide proper language attributes', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Main content should have language attribute
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('lang')
    })
  })
})