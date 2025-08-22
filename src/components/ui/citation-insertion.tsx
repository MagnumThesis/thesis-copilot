"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Separator } from "./shadcn/separator"
import { CitationStyle, Reference } from "../../lib/ai-types"
import { X, Quote, FileText } from "lucide-react"

interface CitationInsertionProps {
  selectedText?: string
  onCitationInsert: (citation: string) => Promise<boolean>
  onBibliographyInsert: (bibliography: string) => Promise<boolean>
  currentCitationStyle: CitationStyle
  availableReferences?: Reference[]
  onClose: () => void
  className?: string
}

interface InsertionState {
  selectedReferences: Reference[]
  inlineCitation: string
  bibliographyEntry: string
  isProcessing: boolean
  error: string | null
}

export const CitationInsertion: React.FC<CitationInsertionProps> = ({
  selectedText,
  onCitationInsert,
  onBibliographyInsert,
  currentCitationStyle,
  availableReferences = [],
  onClose,
  className = ''
}) => {
  const [state, setState] = useState<InsertionState>({
    selectedReferences: [],
    inlineCitation: '',
    bibliographyEntry: '',
    isProcessing: false,
    error: null
  })

  const [showPreview, setShowPreview] = useState(false)

  // Filter references based on selected text if available
  const relevantReferences = React.useMemo(() => {
    if (!selectedText || availableReferences.length === 0) {
      return availableReferences
    }

    const searchText = selectedText.toLowerCase()
    return availableReferences.filter(ref =>
      ref.title.toLowerCase().includes(searchText) ||
      ref.authors.some(author =>
        `${author.firstName} ${author.lastName}`.toLowerCase().includes(searchText)
      ) ||
      (ref.journal && ref.journal.toLowerCase().includes(searchText))
    )
  }, [availableReferences, selectedText])

  const handleReferenceSelect = (reference: Reference) => {
    setState(prev => ({
      ...prev,
      selectedReferences: prev.selectedReferences.includes(reference)
        ? prev.selectedReferences.filter(r => r.id !== reference.id)
        : [...prev.selectedReferences, reference]
    }))
  }

  const handleRemoveReference = (referenceId: string) => {
    setState(prev => ({
      ...prev,
      selectedReferences: prev.selectedReferences.filter(r => r.id !== referenceId)
    }))
  }

  const handleCitationPreview = async () => {
    if (state.selectedReferences.length === 0) return

    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Format citation using the citation formatter
      const citation = await formatCitation(state.selectedReferences, currentCitationStyle)
      const bibliography = await formatBibliography(state.selectedReferences, currentCitationStyle)

      setState(prev => ({
        ...prev,
        inlineCitation: citation,
        bibliographyEntry: bibliography,
        isProcessing: false
      }))

      setShowPreview(true)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to format citation',
        isProcessing: false
      }))
    }
  }

  const handleInsertCitation = async () => {
    if (!state.inlineCitation) return

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const success = await onCitationInsert(state.inlineCitation)
      if (success) {
        onClose()
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to insert citation',
        isProcessing: false
      }))
    }
  }

  const handleInsertBibliography = async () => {
    if (!state.bibliographyEntry) return

    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const success = await onBibliographyInsert(state.bibliographyEntry)
      if (success) {
        onClose()
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to insert bibliography',
        isProcessing: false
      }))
    }
  }

  // Mock citation formatting (would be replaced with actual citation engine)
  const formatCitation = async (references: Reference[], style: CitationStyle): Promise<string> => {
    if (references.length === 0) return ''

    const firstRef = references[0]
    const firstAuthor = firstRef.authors[0]
    const year = firstRef.publicationDate ? new Date(firstRef.publicationDate).getFullYear() : 'n.d.'

    switch (style) {
      case CitationStyle.APA:
        return `(${firstAuthor?.lastName || 'Unknown'}, ${year})`
      case CitationStyle.MLA:
        return `(${firstAuthor?.lastName || 'Unknown'} ${year})`
      case CitationStyle.CHICAGO:
        return `(${firstAuthor?.lastName || 'Unknown'}, ${year})`
      default:
        return `(${firstAuthor?.lastName || 'Unknown'}, ${year})`
    }
  }

  const formatBibliography = async (references: Reference[], style: CitationStyle): Promise<string> => {
    if (references.length === 0) return ''

    const firstRef = references[0]
    const authors = firstRef.authors.map(author =>
      `${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}`
    ).join(', ')

    const year = firstRef.publicationDate ? new Date(firstRef.publicationDate).getFullYear() : 'n.d.'
    const title = firstRef.title
    const journal = firstRef.journal || ''
    const volume = firstRef.volume || ''
    const issue = firstRef.issue || ''
    const pages = firstRef.pages || ''

    switch (style) {
      case CitationStyle.APA:
        return `${authors} (${year}). ${title}.${journal ? ` ${journal}` : ''}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.`
      case CitationStyle.MLA:
        return `${authors}. "${title}." ${journal}${volume ? ` ${volume}` : ''}${issue ? `.${issue}` : ''}${pages ? ` (${pages})` : ''} ${year}.`
      case CitationStyle.CHICAGO:
        return `${authors}. "${title}." ${journal} ${volume}${issue ? `, no. ${issue}` : ''} (${year}): ${pages}.`
      default:
        return `${authors} (${year}). ${title}.`
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Quote className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Insert Citation</h3>
          {selectedText && (
            <Badge variant="secondary" className="text-xs">
              Selected: "{selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}"
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Reference Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Select References</h4>
          <Badge variant="outline" className="text-xs">
            {state.selectedReferences.length} selected
          </Badge>
        </div>

        <div className="max-h-40 overflow-y-auto space-y-2">
          {relevantReferences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No references available
            </p>
          ) : (
            relevantReferences.map((reference) => (
              <div
                key={reference.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  state.selectedReferences.includes(reference)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleReferenceSelect(reference)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reference.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {reference.authors[0] ?
                        `${reference.authors[0].lastName}, ${reference.authors[0].firstName}` :
                        'Unknown author'
                      }
                      {reference.publicationDate && ` (${new Date(reference.publicationDate).getFullYear()})`}
                    </p>
                  </div>
                  {state.selectedReferences.includes(reference) && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected References Summary */}
      {state.selectedReferences.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected References</h4>
            <div className="space-y-1">
              {state.selectedReferences.map((reference) => (
                <div key={reference.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-xs truncate">{reference.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveReference(reference.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Citation Style */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Citation Style:</span>
        <Badge variant="secondary">{currentCitationStyle.toUpperCase()}</Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleCitationPreview}
          disabled={state.selectedReferences.length === 0 || state.isProcessing}
          className="flex-1"
        >
          {state.isProcessing ? 'Processing...' : 'Preview Citation'}
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (state.inlineCitation || state.bibliographyEntry) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Citation Preview</h4>

            {state.inlineCitation && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Inline Citation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {state.inlineCitation}
                  </p>
                  <Button
                    onClick={handleInsertCitation}
                    disabled={state.isProcessing}
                    className="w-full"
                    size="sm"
                  >
                    <Quote className="h-4 w-4 mr-2" />
                    Insert Citation
                  </Button>
                </CardContent>
              </Card>
            )}

            {state.bibliographyEntry && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bibliography Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                    {state.bibliographyEntry}
                  </p>
                  <Button
                    onClick={handleInsertBibliography}
                    disabled={state.isProcessing}
                    className="w-full"
                    variant="outline"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Insert Bibliography
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Error */}
      {state.error && (
        <Card className="border-red-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-600">
              <X className="h-4 w-4" />
              <span className="text-sm">{state.error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
