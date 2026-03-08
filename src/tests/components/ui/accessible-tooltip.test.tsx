import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccessibleTooltip, CategoryTooltip, SeverityTooltip } from '@/components/ui/accessible-tooltip'
import React from 'react'

// Mock the shadcn/radix Tooltip components to avoid dealing with portal and timer issues
vi.mock('@/components/ui/shadcn/tooltip', () => {
  return {
    TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Tooltip: ({ children, open, onOpenChange }: any) => {
      // Create a simplified version that passes state down
      return (
        <div data-testid="tooltip-root" data-open={open}>
          {children}
        </div>
      )
    },
    TooltipTrigger: ({ children, asChild, ...props }: any) => {
      return React.cloneElement(children, {
        ...props,
        'data-testid': 'tooltip-trigger'
      })
    },
    TooltipContent: ({ children, className, ...props }: any) => {
      return (
        <div data-testid="tooltip-content" className={className} {...props}>
          {children}
        </div>
      )
    }
  }
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('@/hooks/use-accessibility', () => ({
  useAccessibility: () => ({
    preferences: { prefersReducedMotion: false, prefersHighContrast: false },
    generateId: (prefix: string) => `${prefix}-mock-id`
  })
}))

describe('AccessibleTooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children correctly', () => {
    render(
      <AccessibleTooltip content="Tooltip content">
        <button>Hover me</button>
      </AccessibleTooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('renders tooltip content', () => {
    render(
      <AccessibleTooltip content="Test Tooltip">
        <button>Hover me</button>
      </AccessibleTooltip>
    )

    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument()
    expect(screen.getByText('Test Tooltip')).toBeInTheDocument()
  })

  it('supports persistent tooltips', () => {
    render(
      <AccessibleTooltip content="Persistent Tooltip" persistent>
        <button>Click me</button>
      </AccessibleTooltip>
    )

    expect(screen.getByTestId('tooltip-root')).toHaveAttribute('data-open', 'false')
  })

  it('renders hotkey when provided', () => {
    render(
      <AccessibleTooltip content="Save action" hotkey="Ctrl+S">
        <button>Save</button>
      </AccessibleTooltip>
    )

    expect(screen.getByText('Ctrl+S')).toBeInTheDocument()
  })

  it('applies different styles based on type', () => {
    const { rerender } = render(
      <AccessibleTooltip content="Error message" type="error">
        <button>Trigger</button>
      </AccessibleTooltip>
    )

    let content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-red-50')
    expect(content.className).toContain('border-red-200')

    rerender(
      <AccessibleTooltip content="Success message" type="success">
        <button>Trigger</button>
      </AccessibleTooltip>
    )

    content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-green-50')
    expect(content.className).toContain('border-green-200')

    rerender(
      <AccessibleTooltip content="Warning message" type="warning">
        <button>Trigger</button>
      </AccessibleTooltip>
    )

    content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-yellow-50')
    expect(content.className).toContain('border-yellow-200')

    rerender(
      <AccessibleTooltip content="Help message" type="help">
        <button>Trigger</button>
      </AccessibleTooltip>
    )

    content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-blue-50')
    expect(content.className).toContain('border-blue-200')
  })

  it('applies accessible aria attributes', () => {
    render(
      <AccessibleTooltip content="Aria test" describedBy={true} type="error">
        <button>Trigger</button>
      </AccessibleTooltip>
    )

    const trigger = screen.getByTestId('tooltip-trigger')
    expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-mock-id')
    expect(trigger).not.toHaveAttribute('aria-labelledby')

    const content = screen.getByTestId('tooltip-content')
    expect(content).toHaveAttribute('role', 'alert')
    expect(content).toHaveAttribute('aria-live', 'assertive')
  })
})

describe('CategoryTooltip', () => {
  it('renders correctly with default content for a category', () => {
    render(
      <CategoryTooltip category="clarity">
        <span>Clarity Info</span>
      </CategoryTooltip>
    )

    expect(screen.getByText(/Clarity concerns relate to how clear and understandable your writing is/i)).toBeInTheDocument()

    const content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-blue-50') // 'help' type
  })

  it('handles unknown categories gracefully', () => {
    render(
      <CategoryTooltip category="unknown_category">
        <span>Unknown Info</span>
      </CategoryTooltip>
    )

    expect(screen.getByText(/unknown_category concerns relate to specific aspects/i)).toBeInTheDocument()
  })
})

describe('SeverityTooltip', () => {
  it('renders correctly for critical severity', () => {
    render(
      <SeverityTooltip severity="critical">
        <span>Critical Info</span>
      </SeverityTooltip>
    )

    expect(screen.getByText(/Critical concerns require immediate attention/i)).toBeInTheDocument()

    const content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-red-50') // 'error' type
  })

  it('renders correctly for high severity', () => {
    render(
      <SeverityTooltip severity="high">
        <span>High Info</span>
      </SeverityTooltip>
    )

    expect(screen.getByText(/High priority concerns are important issues/i)).toBeInTheDocument()

    const content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-yellow-50') // 'warning' type
  })

  it('renders correctly for medium/low severity', () => {
    render(
      <SeverityTooltip severity="low">
        <span>Low Info</span>
      </SeverityTooltip>
    )

    expect(screen.getByText(/Low priority concerns are minor suggestions/i)).toBeInTheDocument()

    const content = screen.getByTestId('tooltip-content')
    expect(content.className).toContain('bg-gray-50') // 'info' type
  })
})
