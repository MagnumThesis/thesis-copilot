"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Badge } from "./shadcn/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { CitationStyle, Reference, ReferenceType } from "../../lib/ai-types"
import { Edit, Trash2, ExternalLink } from "lucide-react"

/**
 * Props for the ReferenceList component
 */
interface ReferenceListProps {
  /** The ID of the conversation to load references for */
  conversationId: string
  /** The search query to filter references */
  searchQuery: string
  /** The reference type to filter by, or 'all' for no filter */
  filterType: ReferenceType | 'all'
  /** Callback function called when the edit button is clicked for a reference */
  onEdit: (referenceId: string) => void
  /** The citation style to use for formatting references */
  citationStyle: CitationStyle
}

/**
 * Extended Reference interface that includes formatted citation text
 */
interface ReferenceWithFormattedCitation extends Reference {
  /** The formatted citation text according to the selected citation style */
  formattedCitation: string
}

/**
 * A component that displays a list of references with filtering and editing capabilities.
 * This component loads references from storage, formats them according to the selected citation style,
 * and provides UI for editing and deleting references.
 * 
 * @param {ReferenceListProps} props - The props for the ReferenceList component
 * @param {string} props.conversationId - The ID of the conversation to load references for
 * @param {string} props.searchQuery - The search query to filter references
 * @param {ReferenceType | 'all'} props.filterType - The reference type to filter by, or 'all' for no filter
 * @param {(referenceId: string) => void} props.onEdit - Callback function called when the edit button is clicked for a reference
 * @param {CitationStyle} props.citationStyle - The citation style to use for formatting references
 * 
 * @example
 * ```tsx
 * <ReferenceList
 *   conversationId="conv-123"
 *   searchQuery=""
 *   filterType="all"
 *   onEdit={(refId) => console.log("Editing reference:", refId)}
 *   citationStyle={CitationStyle.APA}
 * />
 * ```
 */
export const ReferenceList: React.FC<ReferenceListProps> = ({
  conversationId,
  searchQuery,
  filterType,
  onEdit,
  citationStyle
}) => {
  const [references, setReferences] = useState<ReferenceWithFormattedCitation[]>([])
  const [loading, setLoading] = useState(true)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [localFilterType, setLocalFilterType] = useState(filterType)

  // Load references from localStorage or API
  useEffect(() => {
    loadReferences()
  }, [conversationId])

  // Update local state when props change
  useEffect(() => {
    setLocalSearchQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    setLocalFilterType(filterType)
  }, [filterType])

  const loadReferences = async () => {
    setLoading(true)
    try {
      // In a real app, this would fetch from your API/database
      // For now, we'll simulate loading from localStorage
      const stored = localStorage.getItem(`references_${conversationId}`)
      const refs = stored ? JSON.parse(stored) : []

      // Add formatted citations (simplified for demo)
      const refsWithCitations = refs.map((ref: Reference) => ({
        ...ref,
        formattedCitation: formatCitation(ref, citationStyle)
      }))

      setReferences(refsWithCitations)
    } catch (error) {
      console.error('Error loading references:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCitation = (reference: Reference, style: CitationStyle): string => {
    // Convert authors to strings
    const authorStrings = reference.authors.map(author => 
      typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`
    );
    
    // Simplified citation formatting - in a real app you'd use a proper citation library
    switch (style) {
      case CitationStyle.APA:
        return `${authorStrings.join(', ')} (${reference.publication_date || 'n.d.'}). ${reference.title}. ${reference.journal || reference.publisher || ''}.`
      case CitationStyle.MLA:
        return `${authorStrings.join(', ')}. "${reference.title}." ${reference.journal || reference.publisher || ''}, ${reference.publication_date || 'n.d.'}.`
      default:
        return `${authorStrings.join(', ')} (${reference.publication_date || 'n.d.'}). ${reference.title}.`
    }
  }

  const filteredReferences = references.filter(ref => {
    const matchesSearch = ref.title.toLowerCase().includes(localSearchQuery.toLowerCase()) ||
                         ref.authors.some(author => 
                           (typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`)
                           .toLowerCase().includes(localSearchQuery.toLowerCase())
                         );
    const matchesFilter = localFilterType === 'all' || ref.type === localFilterType;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (referenceId: string) => {
    if (confirm('Are you sure you want to delete this reference?')) {
      try {
        // Remove from local state
        setReferences(prev => prev.filter(ref => ref.id !== referenceId))

        // Update localStorage
        const updatedRefs = references.filter(ref => ref.id !== referenceId)
        localStorage.setItem(`references_${conversationId}`, JSON.stringify(updatedRefs))
      } catch (error) {
        console.error('Error deleting reference:', error)
      }
    }
  }

  const getTypeColor = (type: ReferenceType): string => {
    switch (type) {
      case ReferenceType.JOURNAL_ARTICLE: return 'bg-blue-100 text-blue-800'
      case ReferenceType.BOOK: return 'bg-green-100 text-green-800'
      case ReferenceType.CONFERENCE_PAPER: return 'bg-purple-100 text-purple-800'
      case ReferenceType.WEBSITE: return 'bg-orange-100 text-orange-800'
      case ReferenceType.THESIS: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading references...</div>
      </div>
    )
  }

  if (references.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          No references found for this conversation.
        </div>
        <div className="text-sm text-muted-foreground">
          Add your first reference to get started.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          References ({filteredReferences.length})
        </h3>
      </div>

      <div className="space-y-3">
        {filteredReferences.map((reference) => (
          <Card key={reference.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base font-medium leading-tight">
                    {reference.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getTypeColor(reference.type)}>
                      {reference.type.replace('_', ' ')}
                    </Badge>
                    {reference.publication_date && (
                      <Badge variant="outline">
                        {reference.publication_date}
                      </Badge>
                    )}
                    {reference.doi && (
                      <a
                        href={`https://doi.org/${reference.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(reference.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(reference.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground mb-3">
                <strong>Authors:</strong> {reference.authors.map(author => 
                  typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`
                ).join(', ')}
              </div>

              {reference.journal && (
                <div className="text-sm text-muted-foreground mb-3">
                  <strong>Journal:</strong> {reference.journal}
                </div>
              )}

              {reference.publisher && (
                <div className="text-sm text-muted-foreground mb-3">
                  <strong>Publisher:</strong> {reference.publisher}
                </div>
              )}

              {reference.doi && (
                <div className="text-sm text-muted-foreground mb-3">
                  <strong>DOI:</strong> {reference.doi}
                </div>
              )}

              <div className="border-t pt-3 mt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Formatted Citation ({citationStyle.toUpperCase()}):
                </div>
                <div className="text-sm bg-muted p-3 rounded text-muted-foreground">
                  {reference.formattedCitation}
                </div>
              </div>

              {reference.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {reference.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
