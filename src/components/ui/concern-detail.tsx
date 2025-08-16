"use client"

import React, { useState } from "react"
import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from "@/lib/ai-types"
import { Button } from "@/components/ui/shadcn/button"
import { Badge } from "@/components/ui/shadcn/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/shadcn/tooltip"
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle, Info, Lightbulb, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

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
  
  // Use controlled expansion if provided, otherwise use internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded
  const toggleExpanded = onToggleExpanded || (() => setInternalExpanded(!internalExpanded))

  const getSeverityColor = (severity: ConcernSeverity) => {
    switch (severity) {
      case ConcernSeverity.CRITICAL:
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      case ConcernSeverity.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800"
      case ConcernSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
      case ConcernSeverity.LOW:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
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
      case ConcernCategory.ACADEMIC_STYLE:
        return "Academic Style"
      case ConcernCategory.CONSISTENCY:
        return "Consistency"
      case ConcernCategory.COMPLETENESS:
        return "Completeness"
      case ConcernCategory.CITATIONS:
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
    switch (category) {
      case ConcernCategory.CLARITY:
      case ConcernCategory.COHERENCE:
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
      case ConcernCategory.STRUCTURE:
      case ConcernCategory.COMPLETENESS:
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800"
      case ConcernCategory.ACADEMIC_STYLE:
      case ConcernCategory.TERMINOLOGY:
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      case ConcernCategory.CONSISTENCY:
      case ConcernCategory.CITATIONS:
        return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800"
      case ConcernCategory.GRAMMAR:
        return "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
    }
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

  return (
    <TooltipProvider>
      <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
        <div className={cn(
          "border rounded-lg p-3 transition-all duration-200 hover:shadow-sm",
          concern.status === ConcernStatus.ADDRESSED && "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800",
          concern.status === ConcernStatus.REJECTED && "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800",
          concern.status === ConcernStatus.TO_BE_DONE && "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
        )}>
          <CollapsibleTrigger asChild>
            <button className="flex items-start justify-between cursor-pointer w-full text-left border-none bg-transparent p-0 hover:opacity-80 transition-opacity">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <h4 className="font-medium text-sm truncate">{concern.title}</h4>
                  <div className="flex items-center gap-1 ml-auto">
                    <Tooltip>
                      <TooltipTrigger>
                        <div data-testid="status-icon">
                          {getStatusIcon(concern.status)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getStatusLabel(concern.status)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-6 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className={cn("text-xs", getSeverityColor(concern.severity))}>
                        {getSeverityIcon(concern.severity)}
                        <span className="ml-1">{concern.severity}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Severity: {concern.severity}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Badge variant="outline" className={cn("text-xs", getCategoryColor(concern.category))}>
                    {getCategoryLabel(concern.category)}
                  </Badge>
                  
                  {concern.location && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-2 w-2 mr-1" />
                          Location
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {concern.location.section && `Section: ${concern.location.section}`}
                          {concern.location.paragraph && ` • Paragraph: ${concern.location.paragraph}`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Updated: {new Date(concern.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </button>
          </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <div className="ml-6 space-y-3">
            {/* Description */}
            <div>
              <p className="text-sm text-muted-foreground">{concern.description}</p>
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
                <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Suggestions
                </h5>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                  <ul className="text-xs space-y-2">
                    {concern.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">•</span>
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
            <div className="flex gap-2 pt-3 border-t">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={concern.status === ConcernStatus.ADDRESSED ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusChange(ConcernStatus.ADDRESSED)
                    }}
                    className={cn(
                      "text-xs transition-all",
                      concern.status === ConcernStatus.ADDRESSED && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {concern.status === ConcernStatus.ADDRESSED ? "Addressed" : "Mark Addressed"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark this concern as addressed</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={concern.status === ConcernStatus.REJECTED ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusChange(ConcernStatus.REJECTED)
                    }}
                    className={cn(
                      "text-xs transition-all",
                      concern.status === ConcernStatus.REJECTED && "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    {concern.status === ConcernStatus.REJECTED ? "Rejected" : "Reject"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mark this concern as not applicable</p>
                </TooltipContent>
              </Tooltip>
              
              {concern.status !== ConcernStatus.TO_BE_DONE && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStatusChange(ConcernStatus.TO_BE_DONE)
                      }}
                      className="text-xs"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to pending status</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
    </TooltipProvider>
  )
}