"use client"

import React, { useState } from "react"
import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from "@/lib/ai-types"
import { Button } from "@/components/ui/shadcn/button"
import { Badge } from "@/components/ui/shadcn/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/shadcn/collapsible"
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock } from "lucide-react"
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
        return "bg-red-100 text-red-800 border-red-200"
      case ConcernSeverity.HIGH:
        return "bg-orange-100 text-orange-800 border-orange-200"
      case ConcernSeverity.MEDIUM:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case ConcernSeverity.LOW:
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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
    <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
      <div className={cn(
        "border rounded-md p-3 transition-colors",
        concern.status === ConcernStatus.ADDRESSED && "bg-green-50 border-green-200",
        concern.status === ConcernStatus.REJECTED && "bg-red-50 border-red-200",
        concern.status === ConcernStatus.TO_BE_DONE && "bg-yellow-50 border-yellow-200"
      )}>
        <CollapsibleTrigger asChild>
          <button className="flex items-start justify-between cursor-pointer w-full text-left border-none bg-transparent p-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <h4 className="font-medium text-sm truncate">{concern.title}</h4>
              </div>
              
              <div className="flex items-center gap-2 ml-6">
                <Badge variant="outline" className={getSeverityColor(concern.severity)}>
                  {concern.severity}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getCategoryLabel(concern.category)}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getStatusIcon(concern.status)}
                  <span>{getStatusLabel(concern.status)}</span>
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
                <h5 className="text-xs font-medium text-muted-foreground mb-1">Suggestions</h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {concern.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
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
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant={concern.status === ConcernStatus.ADDRESSED ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(ConcernStatus.ADDRESSED)
                }}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Addressed
              </Button>
              <Button
                size="sm"
                variant={concern.status === ConcernStatus.REJECTED ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(ConcernStatus.REJECTED)
                }}
                className="text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
              {concern.status !== ConcernStatus.TO_BE_DONE && (
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
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}