"use client"

import React, { useState } from "react"
import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from "@/lib/ai-types"
import { Button } from "@/components/ui/shadcn/button"
import { Badge } from "@/components/ui/shadcn/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible"
import { TooltipProvider } from "@/components/ui/shadcn/tooltip"

import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle, Info, Lightbulb, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAccessibility, useLiveRegion } from "@/hooks/use-accessibility"
import { AccessibleTooltip } from "@/components/ui/accessible-tooltip"

interface ConcernDetailProps {
  concern: ProofreadingConcern
  onStatusChange: (status: ConcernStatus) => void
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export const ConcernDetail: React.FC<ConcernDetailProps> = ({
  concern,
  onStatusChange,
  isExpanded: controlledExpanded,
  onToggleExpanded
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false)
  
  // Accessibility hooks
  const { preferences, getAccessibilityClasses, generateId } = useAccessibility()
  const { announce } = useLiveRegion()
  
  const concernId = generateId('concern')
  const descriptionId = generateId('concern-description')
  const suggestionsId = generateId('concern-suggestions')
  
  // Use controlled expansion if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const toggleExpanded = onToggleExpanded || (() => setInternalExpanded(!internalExpanded))

  const getSeverityColor = (severity: ConcernSeverity) => {
    const baseColors = {
      [ConcernSeverity.CRITICAL]: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
      [ConcernSeverity.HIGH]: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800",
      [ConcernSeverity.MEDIUM]: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
      [ConcernSeverity.LOW]: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
    }
    
    const highContrastColors = {
      [ConcernSeverity.CRITICAL]: "bg-red-200 text-red-900 border-red-400 dark:bg-red-800 dark:text-red-100 dark:border-red-600",
      [ConcernSeverity.HIGH]: "bg-orange-200 text-orange-900 border-orange-400 dark:bg-orange-800 dark:text-orange-100 dark:border-orange-600",
      [ConcernSeverity.MEDIUM]: "bg-yellow-200 text-yellow-900 border-yellow-400 dark:bg-yellow-800 dark:text-yellow-100 dark:border-yellow-600",
      [ConcernSeverity.LOW]: "bg-blue-200 text-blue-900 border-blue-400 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600"
    }
    
    const colors = preferences.prefersHighContrast ? highContrastColors : baseColors
    return colors[severity] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  }

  const getSeverityIcon = (severity: ConcernSeverity) => {
    switch (severity) {
      case ConcernSeverity.CRITICAL:
        return <AlertCircle className="h-3 w-3" />
      case ConcernSeverity.HIGH:
        return <AlertTriangle className="h-3 w-3" />
      case ConcernSeverity.MEDIUM:
        return <Info className="h-3 w-3" />
      case ConcernSeverity.LOW:
        return <Info className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getCategoryLabel = (category: ConcernCategory) => {
    switch (category) {
      case ConcernCategory.CLARITY:
        return "Clarity"
      case ConcernCategory.COHERENCE:
        return "Coherence"
      case ConcernCategory.STRUCTURE:
        return "Structure"
      case ConcernCategory.ACADEMIC_TONE:
        return "Academic Style"
      case ConcernCategory.CONSISTENCY:
        return "Consistency"
      case ConcernCategory.COMPLETENESS:
        return "Completeness"
      case ConcernCategory.CITATION:
        return "Citations"
      case ConcernCategory.GRAMMAR:
        return "Grammar"
      case ConcernCategory.TERMINOLOGY:
        return "Terminology"
      default:
        return category
    }
  }

  const getCategoryColor = (category: ConcernCategory) => {
    const baseColors = {
      [ConcernCategory.CLARITY]: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
      [ConcernCategory.COHERENCE]: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
      [ConcernCategory.STRUCTURE]: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
      [ConcernCategory.COMPLETENESS]: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800",
      [ConcernCategory.ACADEMIC_TONE]: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
      [ConcernCategory.TERMINOLOGY]: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
      [ConcernCategory.CONSISTENCY]: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
      [ConcernCategory.CITATION]: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
      [ConcernCategory.GRAMMAR]: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800"
    }
    
    const highContrastColors = {
      [ConcernCategory.CLARITY]: "bg-purple-200 text-purple-900 border-purple-400 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-600",
      [ConcernCategory.COHERENCE]: "bg-purple-200 text-purple-900 border-purple-400 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-600",
      [ConcernCategory.STRUCTURE]: "bg-indigo-200 text-indigo-900 border-indigo-400 dark:bg-indigo-800 dark:text-indigo-100 dark:border-indigo-600",
      [ConcernCategory.COMPLETENESS]: "bg-indigo-200 text-indigo-900 border-indigo-400 dark:bg-indigo-800 dark:text-indigo-100 dark:border-indigo-600",
      [ConcernCategory.ACADEMIC_TONE]: "bg-green-200 text-green-900 border-green-400 dark:bg-green-800 dark:text-green-100 dark:border-green-600",
      [ConcernCategory.TERMINOLOGY]: "bg-green-200 text-green-900 border-green-400 dark:bg-green-800 dark:text-green-100 dark:border-green-600",
      [ConcernCategory.CONSISTENCY]: "bg-cyan-200 text-cyan-900 border-cyan-400 dark:bg-cyan-800 dark:text-cyan-100 dark:border-cyan-600",
      [ConcernCategory.CITATION]: "bg-cyan-200 text-cyan-900 border-cyan-400 dark:bg-cyan-800 dark:text-cyan-100 dark:border-cyan-600",
      [ConcernCategory.GRAMMAR]: "bg-pink-200 text-pink-900 border-pink-400 dark:bg-pink-800 dark:text-pink-100 dark:border-pink-600"
    }
    
    const colors = preferences.prefersHighContrast ? highContrastColors : baseColors
    return (colors as Record<string, string>)[category] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  }

  const getStatusIcon = (status: ConcernStatus) => {
    switch (status) {
      case ConcernStatus.ADDRESSED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case ConcernStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case ConcernStatus.TO_BE_DONE:
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: ConcernStatus) => {
    switch (status) {
      case ConcernStatus.ADDRESSED:
        return "Addressed"
      case ConcernStatus.REJECTED:
        return "Rejected"
      case ConcernStatus.TO_BE_DONE:
        return "To be done"
      default:
        return status
    }
  }

  // Handle status change with announcement
  const handleStatusChange = (newStatus: ConcernStatus) => {
    onStatusChange(newStatus)
    const statusText = getStatusLabel(newStatus)
    announce(`Concern "${concern.title}" marked as ${statusText}`)
  }

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleExpanded()
    }
  }

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
        <div 
          className={cn(
            "border rounded-lg p-3 transition-all duration-200 hover:shadow-sm focus-within:ring-2 focus-within:ring-blue-500",
            getAccessibilityClasses(),
            concern.status === ConcernStatus.ADDRESSED && "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800",
            concern.status === ConcernStatus.REJECTED && "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800",
            concern.status === ConcernStatus.TO_BE_DONE && "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800",
            preferences.prefersReducedMotion && "transition-none"
          )}
          data-testid="concern-detail"
          role="article"
          aria-labelledby={`${concernId}-title`}
          aria-describedby={`${descriptionId} ${suggestionsId}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <CollapsibleTrigger asChild>
            <button 
              className={cn(
                "flex items-start justify-between cursor-pointer w-full text-left border-none bg-transparent p-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
                preferences.prefersReducedMotion && "transition-none"
              )}
              aria-expanded={isExpanded}
              aria-controls={`${concernId}-content`}
              aria-describedby={descriptionId}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <AccessibleTooltip 
                    content={isExpanded ? "Collapse concern details" : "Expand concern details"}
                    type="help"
                    hotkey="Enter or Space"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    )}
                  </AccessibleTooltip>
                  <h4 id={`${concernId}-title`} className="font-medium text-sm truncate">{concern.title}</h4>
                  <div className="flex items-center gap-1 ml-auto">
                    <AccessibleTooltip 
                      content={`Current status: ${getStatusLabel(concern.status)}`}
                      type="info"
                    >
                      <div 
                        data-testid="status-icon"
                        aria-label={`Status: ${getStatusLabel(concern.status)}`}
                        role="img"
                      >
                        {getStatusIcon(concern.status)}
                      </div>
                    </AccessibleTooltip>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-6 flex-wrap">
                  <AccessibleTooltip 
                    content={`Severity level: ${concern.severity}. ${concern.severity === 'critical' ? 'Requires immediate attention' : concern.severity === 'high' ? 'Important to address' : concern.severity === 'medium' ? 'Should be addressed' : 'Low priority'}`}
                    type={concern.severity === 'critical' ? 'error' : concern.severity === 'high' ? 'warning' : 'info'}
                  >
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getSeverityColor(concern.severity))}
                      data-testid="severity-indicator"
                      aria-label={`${concern.severity} severity concern`}
                    >
                      {getSeverityIcon(concern.severity)}
                      <span className="ml-1">{concern.severity}</span>
                    </Badge>
                  </AccessibleTooltip>
                  
                  <AccessibleTooltip 
                    content={`Category: ${getCategoryLabel(concern.category)}. This concern relates to ${concern.category.replace('_', ' ').toLowerCase()} aspects of your writing.`}
                    type="help"
                  >
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getCategoryColor(concern.category))}
                      aria-label={`${getCategoryLabel(concern.category)} category`}
                    >
                      {getCategoryLabel(concern.category)}
                    </Badge>
                  </AccessibleTooltip>
                  
                  {concern.location && (
                    <AccessibleTooltip 
                      content={`Location: ${concern.location.section ? `Section: ${concern.location.section}` : ''}${concern.location.paragraph ? ` • Paragraph: ${concern.location.paragraph}` : ''}`}
                      type="info"
                    >
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        aria-label={`Concern location: ${concern.location.section ? `${concern.location.section}` : ''}${concern.location.paragraph ? `, paragraph ${concern.location.paragraph}` : ''}`}
                      >
                        <MapPin className="h-2 w-2 mr-1" aria-hidden="true" />
                        Location
                      </Badge>
                    </AccessibleTooltip>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Updated: {new Date(concern.updatedAt || '').toLocaleDateString()}
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

        <CollapsibleContent 
          className="mt-3"
          id={`${concernId}-content`}
        >
          <div className="ml-6 space-y-3">
            {/* Description */}
            <div>
              <p 
                id={descriptionId}
                className="text-sm text-muted-foreground"
                aria-label="Concern description"
              >
                {concern.description}
              </p>
            </div>

            {/* Location */}
            {concern.location && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">Location</h5>
                <div className="text-xs text-muted-foreground">
                  {concern.location.section && (
                    <span>Section: {concern.location.section}</span>
                  )}
                  {concern.location.paragraph && (
                    <span className="ml-2">Paragraph: {concern.location.paragraph}</span>
                  )}
                  {concern.location.context && (
                    <div className="mt-1 p-2 bg-gray-100 rounded text-xs italic">
                      "{concern.location.context}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {concern.suggestions && concern.suggestions.length > 0 && (
              <div>
                <h5 
                  className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"
                  id={`${suggestionsId}-heading`}
                >
                  <Lightbulb className="h-3 w-3" aria-hidden="true" />
                  Suggestions
                </h5>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <ul 
                    id={suggestionsId}
                    className="text-xs space-y-2"
                    role="list"
                    aria-labelledby={`${suggestionsId}-heading`}
                  >
                    {concern.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2" role="listitem">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold" aria-hidden="true">•</span>
                        <span className="text-blue-800 dark:text-blue-200">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Related Ideas */}
            {concern.relatedIdeas && concern.relatedIdeas.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-muted-foreground mb-1">Related Ideas</h5>
                <div className="flex flex-wrap gap-1">
                  {concern.relatedIdeas.map((ideaId, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {ideaId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="flex gap-2 pt-3 border-t" role="group" aria-label="Concern status actions">
              <AccessibleTooltip 
                content="Mark this concern as addressed - indicates you have resolved the issue"
                type="success"
                hotkey="A"
              >
                <Button
                  size="sm"
                  variant={concern.status === ConcernStatus.ADDRESSED ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(ConcernStatus.ADDRESSED)
                  }}
                  className={cn(
                    "text-xs transition-all focus:ring-2 focus:ring-green-500",
                    concern.status === ConcernStatus.ADDRESSED && "bg-green-600 hover:bg-green-700",
                    preferences.prefersReducedMotion && "transition-none"
                  )}
                  aria-pressed={concern.status === ConcernStatus.ADDRESSED}
                  aria-describedby={descriptionId}
                >
                  <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                  {concern.status === ConcernStatus.ADDRESSED ? "Addressed" : "Mark Addressed"}
                </Button>
              </AccessibleTooltip>
              
              <AccessibleTooltip 
                content="Mark this concern as rejected - indicates the concern is not applicable or you disagree with it"
                type="error"
                hotkey="R"
              >
                <Button
                  size="sm"
                  variant={concern.status === ConcernStatus.REJECTED ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(ConcernStatus.REJECTED)
                  }}
                  className={cn(
                    "text-xs transition-all focus:ring-2 focus:ring-red-500",
                    concern.status === ConcernStatus.REJECTED && "bg-red-600 hover:bg-red-700",
                    preferences.prefersReducedMotion && "transition-none"
                  )}
                  aria-pressed={concern.status === ConcernStatus.REJECTED}
                  aria-describedby={descriptionId}
                >
                  <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                  {concern.status === ConcernStatus.REJECTED ? "Rejected" : "Reject"}
                </Button>
              </AccessibleTooltip>
              
              {concern.status !== ConcernStatus.TO_BE_DONE && (
                <AccessibleTooltip 
                  content="Reset this concern to pending status - marks it as needing attention again"
                  type="info"
                  hotkey="U"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(ConcernStatus.TO_BE_DONE)
                    }}
                    className={cn(
                      "text-xs focus:ring-2 focus:ring-blue-500",
                      preferences.prefersReducedMotion && "transition-none"
                    )}
                    aria-describedby={descriptionId}
                  >
                    <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                    Reset
                  </Button>
                </AccessibleTooltip>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
    </TooltipProvider>
  )
}
