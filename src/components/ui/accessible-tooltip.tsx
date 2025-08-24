/**
 * Accessible Tooltip Component
 * Enhanced tooltip with better accessibility features and help text support
 */

"use client"

import React, { useState, useRef, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip"
import { Button } from "@/components/ui/shadcn/button"
import { Badge } from "@/components/ui/shadcn/badge"
import { Info, HelpCircle, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility } from "@/hooks/use-accessibility"

export interface AccessibleTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  delayDuration?: number
  // Accessibility enhancements
  type?: 'info' | 'help' | 'warning' | 'error' | 'success'
  persistent?: boolean // Keep tooltip open until explicitly closed
  describedBy?: boolean // Use aria-describedby instead of aria-labelledby
  hotkey?: string // Show keyboard shortcut
  maxWidth?: number
  className?: string
}

/**
 * Enhanced tooltip component with accessibility features and support for different types (info, help, warning, error, success).
 * It integrates with `shadcn/ui` Tooltip and provides options for persistent display, ARIA attributes, and keyboard shortcuts.
 * @param {AccessibleTooltipProps} props - The properties for the AccessibleTooltip component.
 * @param {React.ReactNode} props.content - The content to be displayed inside the tooltip.
 * @param {React.ReactNode} props.children - The element that triggers the tooltip.
 * @param {"top" | "right" | "bottom" | "left"} [props.side="top"] - The side of the trigger where the tooltip will be displayed.
 * @param {"start" | "center" | "end"} [props.align="center"] - The alignment of the tooltip relative to the trigger.
 * @param {number} [props.delayDuration=200] - The delay in milliseconds before the tooltip appears.
 * @param {'info' | 'help' | 'warning' | 'error' | 'success'} [props.type='info'] - The type of the tooltip, which influences its icon and styling.
 * @param {boolean} [props.persistent=false] - If true, the tooltip remains open until explicitly closed or clicked outside.
 * @param {boolean} [props.describedBy=false] - If true, uses `aria-describedby` for accessibility; otherwise, uses `aria-labelledby`.
 * @param {string} [props.hotkey] - An optional keyboard shortcut to display within the tooltip content.
 * @param {number} [props.maxWidth=300] - The maximum width of the tooltip content.
 * @param {string} [props.className] - Additional CSS classes to apply to the tooltip content.
 * @example
 * ```tsx
 * <AccessibleTooltip content="This is a helpful tip.">
 *   <span>Hover over me</span>
 * </AccessibleTooltip>
 *
 * <AccessibleTooltip content="Action failed!" type="error" persistent>
 *   <button>Delete Item</button>
 * </AccessibleTooltip>
 * ```
 */
export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  type = 'info',
  persistent = false,
  describedBy = false,
  hotkey,
  maxWidth = 300,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { preferences, generateId } = useAccessibility()
  const tooltipId = useRef(generateId('tooltip'))

  const getTypeIcon = () => {
    switch (type) {
      case 'help':
        return <HelpCircle className="h-3 w-3" />
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-600" />
      case 'error':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'success':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100"
      case 'error':
        return "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100"
      case 'success':
        return "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-100"
      case 'help':
        return "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100"
      default:
        return "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-100"
    }
  }

  // Handle persistent tooltip behavior
  useEffect(() => {
    if (persistent && isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element
        if (!target.closest('[data-tooltip-content]')) {
          setIsOpen(false)
        }
      }

      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [persistent, isOpen])

  // Respect user preferences
  const adjustedDelayDuration = preferences.prefersReducedMotion ? 0 : delayDuration

  return (
    <TooltipProvider delayDuration={adjustedDelayDuration}>
      <Tooltip 
        open={persistent ? isOpen : undefined}
        onOpenChange={persistent ? setIsOpen : undefined}
      >
      <TooltipTrigger 
        asChild
        aria-describedby={describedBy ? tooltipId.current : undefined}
        aria-labelledby={!describedBy ? tooltipId.current : undefined}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        id={tooltipId.current}
        side={side}
        align={align}
        className={cn(
          "max-w-xs p-3 text-sm shadow-lg",
          getTypeStyles(),
          preferences.prefersHighContrast && "border-2",
          className
        )}
        style={{ maxWidth: maxWidth }}
        data-tooltip-content
        role={type === 'error' ? 'alert' : 'tooltip'}
        aria-live={type === 'error' || type === 'warning' ? 'assertive' : 'polite'}
      >
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            {getTypeIcon()}
          </div>
          <div className="flex-1">
            <div className="text-sm">{content}</div>
            {hotkey && (
              <div className="mt-1 text-xs opacity-75">
                Keyboard shortcut: <kbd className="px-1 py-0.5 bg-black/10 rounded text-xs">{hotkey}</kbd>
              </div>
            )}
          </div>
          {persistent && (
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 ml-2 text-current opacity-50 hover:opacity-100"
              aria-label="Close tooltip"
            >
              ×
            </button>
          )}
        </div>
      </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Category-specific tooltip helpers
/**
 * A helper component that provides a tooltip with predefined content based on a given category.
 * It uses the `AccessibleTooltip` component internally with a `help` type.
 * @param {object} props - The properties for the CategoryTooltip component.
 * @param {string} props.category - The category string (e.g., 'clarity', 'coherence') for which to display the tooltip content.
 * @param {React.ReactNode} props.children - The element that triggers the tooltip.
 * @example
 * ```tsx
 * <CategoryTooltip category="clarity">
 *   <span>Clarity Info</span>
 * </CategoryTooltip>
 * ```
 */
export const CategoryTooltip: React.FC<{
  category: string
  children: React.ReactNode
}> = ({ category, children }) => {
  const getTooltipContent = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'clarity':
        return "Clarity concerns relate to how clear and understandable your writing is. This includes sentence structure, word choice, and overall readability."
      case 'coherence':
        return "Coherence concerns focus on how well your ideas connect and flow together. This includes logical transitions and argument structure."
      case 'structure':
        return "Structure concerns address the organization of your document, including section order, paragraph structure, and overall layout."
      case 'academic_style':
        return "Academic style concerns relate to formal writing conventions, tone, and adherence to academic writing standards."
      case 'consistency':
        return "Consistency concerns identify contradictions or inconsistent use of terms, formatting, or arguments throughout your document."
      case 'completeness':
        return "Completeness concerns highlight missing information, insufficient detail, or gaps in your argument or analysis."
      case 'citations':
        return "Citation concerns relate to proper referencing, missing citations, and adherence to citation style guidelines."
      case 'grammar':
        return "Grammar concerns identify issues with sentence structure, punctuation, spelling, and other mechanical aspects of writing."
      case 'terminology':
        return "Terminology concerns address the use of technical terms, definitions, and domain-specific language in your field."
      default:
        return `${cat} concerns relate to specific aspects of your academic writing that need attention.`
    }
  }

  return (
    <AccessibleTooltip
      content={getTooltipContent(category)}
      type="help"
    >
      {children}
    </AccessibleTooltip>
  )
}

// Severity-specific tooltip helpers
/**
 * A helper component that provides a tooltip with predefined content and styling based on a given severity level.
 * It uses the `AccessibleTooltip` component internally.
 * @param {object} props - The properties for the SeverityTooltip component.
 * @param {'low' | 'medium' | 'high' | 'critical'} props.severity - The severity level for which to display the tooltip content and apply styling.
 * @param {React.ReactNode} props.children - The element that triggers the tooltip.
 * @example
 * ```tsx
 * <SeverityTooltip severity="high">
 *   <span>High Severity Issue</span>
 * </SeverityTooltip>
 * ```
 */
export const SeverityTooltip: React.FC<{
  severity: 'low' | 'medium' | 'high' | 'critical'
  children: React.ReactNode
}> = ({ severity, children }) => {
  const getTooltipContent = (sev: string) => {
    switch (sev) {
      case 'critical':
        return "Critical concerns require immediate attention as they significantly impact the quality or credibility of your work."
      case 'high':
        return "High priority concerns are important issues that should be addressed to improve your work's quality."
      case 'medium':
        return "Medium priority concerns are noticeable issues that would benefit from attention when you have time."
      case 'low':
        return "Low priority concerns are minor suggestions that could enhance your work but are not essential."
      default:
        return `${sev} priority concern`
    }
  }

  const getType = (sev: string): 'error' | 'warning' | 'info' => {
    switch (sev) {
      case 'critical':
        return 'error'
      case 'high':
        return 'warning'
      default:
        return 'info'
    }
  }

  return (
    <AccessibleTooltip
      content={getTooltipContent(severity)}
      type={getType(severity)}
    >
      {children}
    </AccessibleTooltip>
  )
}