"use client"

import React from "react"
import { ReferenceType, CitationStyle } from "../../lib/ai-types"

interface ReferenceListProps {
  conversationId: string
  searchQuery: string
  filterType: ReferenceType | 'all'
  onEdit: (referenceId: string) => void
  citationStyle: CitationStyle
}

export const ReferenceList: React.FC<ReferenceListProps> = ({
  conversationId,
  searchQuery,
  filterType
}) => {
  return (
    <div className="text-center py-8">
      <div className="text-muted-foreground">
        <p className="text-lg font-medium mb-2">Reference List Component</p>
        <p className="text-sm mb-4">This component will display references for conversation: {conversationId}</p>
        <p className="text-xs">
          Search: "{searchQuery}" | Filter: "{filterType}"
        </p>
      </div>
    </div>
  )
}
