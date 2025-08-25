"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Label } from "./shadcn/label"
import { Textarea } from "./shadcn/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { CitationStyle, Reference, ReferenceType } from "../../lib/ai-types"
import { X, Plus } from "lucide-react"

/**
 * Props for the ReferenceForm component
 */
interface ReferenceFormProps {
  /** The ID of the conversation this reference belongs to */
  conversationId: string
  /** The ID of the reference being edited (optional) */
  referenceId?: string
  /** Callback function to close the form */
  onClose: () => void
  /** The citation style to use for the reference */
  citationStyle: CitationStyle
  /** Prefilled data for the form (optional) */
  prefilledData?: Partial<Reference>
}

/**
 * A form component for creating and editing references.
 * This component provides a comprehensive interface for managing academic references
 * with support for different reference types and metadata fields.
 * 
 * @param {ReferenceFormProps} props - The props for the ReferenceForm component
 * @param {string} props.conversationId - The ID of the conversation this reference belongs to
 * @param {string} [props.referenceId] - The ID of the reference being edited
 * @param {() => void} props.onClose - Callback function to close the form
 * @param {CitationStyle} props.citationStyle - The citation style to use for the reference
 * @param {Partial<Reference>} [props.prefilledData] - Prefilled data for the form
 * 
 * @example
 * ```tsx
 * <ReferenceForm
 *   conversationId="conv-123"
 *   onClose={() => setFormOpen(false)}
 *   citationStyle={CitationStyle.APA}
 * />
 * ```
 * 
 * @example
 * ```tsx
 * <ReferenceForm
 *   conversationId="conv-123"
 *   referenceId="ref-456"
 *   onClose={() => setFormOpen(false)}
 *   citationStyle={CitationStyle.MLA}
 *   prefilledData={{ title: "Existing Reference Title" }}
 * />
 * ```
 */
export const ReferenceForm: React.FC<ReferenceFormProps> = ({
  conversationId,
  referenceId,
  onClose,
  citationStyle,
  prefilledData
}) => {
  const [formData, setFormData] = useState<Partial<Reference>>({
    type: ReferenceType.JOURNAL_ARTICLE,
    title: '',
    authors: [],
    publication_date: '',
    url: '',
    doi: '',
    journal: '',
    volume: '',
    issue: '',
    pages: '',
    publisher: '',
    isbn: '',
    edition: '',
    chapter: '',
    editor: '',
    access_date: '',
    notes: '',
    tags: []
  })

  const [authorInput, setAuthorInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Load existing reference if editing or prefilled data if provided
  useEffect(() => {
    if (referenceId) {
      loadReference()
    } else if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        ...prefilledData
      }))
    }
  }, [referenceId, prefilledData])

  const loadReference = async () => {
    try {
      const stored = localStorage.getItem(`references_${conversationId}`)
      if (stored) {
        const references: Reference[] = JSON.parse(stored)
        const reference = references.find(ref => ref.id === referenceId)
        if (reference) {
          setFormData(reference)
          setIsEditing(true)
        }
      }
    } catch (error) {
      console.error('Error loading reference:', error)
    }
  }

  const handleInputChange = (field: keyof Reference, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addAuthor = () => {
    if (authorInput.trim()) {
      setFormData(prev => ({
        ...prev,
        authors: [...(prev.authors || []), authorInput.trim()]
      }))
      setAuthorInput('')
    }
  }

  const removeAuthor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      authors: (prev.authors || []).filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const now = new Date().toISOString()
      const reference: Reference = {
        id: formData.id || `ref_${Date.now()}`,
        conversation_id: conversationId,
        type: formData.type || ReferenceType.JOURNAL_ARTICLE,
        title: formData.title || '',
        authors: formData.authors || [],
        publication_date: formData.publication_date,
        url: formData.url,
        doi: formData.doi,
        journal: formData.journal,
        volume: formData.volume,
        issue: formData.issue,
        pages: formData.pages,
        publisher: formData.publisher,
        isbn: formData.isbn,
        edition: formData.edition,
        chapter: formData.chapter,
        editor: formData.editor,
        access_date: formData.access_date,
        notes: formData.notes,
        tags: formData.tags || [],
        metadata_confidence: 0.8,
        ai_confidence: 0.8,
        ai_relevance_score: 0,
        created_at: isEditing ? formData.created_at || now : now,
        updated_at: now
      }

      // Get existing references
      const stored = localStorage.getItem(`references_${conversationId}`)
      let references: Reference[] = stored ? JSON.parse(stored) : []

      if (isEditing) {
        // Update existing reference
        references = references.map(ref =>
          ref.id === referenceId ? reference : ref
        )
      } else {
        // Add new reference
        references.push(reference)
      }

      // Save to localStorage
      localStorage.setItem(`references_${conversationId}`, JSON.stringify(references))

      onClose()
    } catch (error) {
      console.error('Error saving reference:', error)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.title && formData.authors && formData.authors.length > 0

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isEditing ? 'Edit Reference' : 'Add New Reference'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="type">Reference Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value as ReferenceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReferenceType.JOURNAL_ARTICLE}>Journal Article</SelectItem>
                  <SelectItem value={ReferenceType.BOOK}>Book</SelectItem>
                  <SelectItem value={ReferenceType.BOOK_CHAPTER}>Book Chapter</SelectItem>
                  <SelectItem value={ReferenceType.CONFERENCE_PAPER}>Conference Paper</SelectItem>
                  <SelectItem value={ReferenceType.THESIS}>Thesis/Dissertation</SelectItem>
                  <SelectItem value={ReferenceType.WEBSITE}>Website</SelectItem>
                  <SelectItem value={ReferenceType.REPORT}>Report</SelectItem>
                  <SelectItem value={ReferenceType.PATENT}>Patent</SelectItem>
                  <SelectItem value={ReferenceType.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter the title of the reference"
                required
              />
            </div>

            {/* Authors */}
            <div>
              <Label>Authors *</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="Add author name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAuthor())}
                />
                <Button type="button" onClick={addAuthor} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.authors || []).map((author, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {typeof author === 'string' ? author : `${author.firstName} ${author.lastName}`}
                    <button
                      type="button"
                      onClick={() => removeAuthor(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="publication_date">Publication Date</Label>
              <Input
                id="publication_date"
                type="date"
                value={formData.publication_date || ''}
                onChange={(e) => handleInputChange('publication_date', e.target.value)}
              />
            </div>
          </div>

          {/* Publication Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Publication Details</h3>

            {(formData.type === ReferenceType.JOURNAL_ARTICLE || formData.type === ReferenceType.CONFERENCE_PAPER) && (
              <>
                <div>
                  <Label htmlFor="journal">Journal/Conference Name</Label>
                  <Input
                    id="journal"
                    value={formData.journal || ''}
                    onChange={(e) => handleInputChange('journal', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="volume">Volume</Label>
                    <Input
                      id="volume"
                      value={formData.volume || ''}
                      onChange={(e) => handleInputChange('volume', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue">Issue</Label>
                    <Input
                      id="issue"
                      value={formData.issue || ''}
                      onChange={(e) => handleInputChange('issue', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pages">Pages</Label>
                  <Input
                    id="pages"
                    value={formData.pages || ''}
                    onChange={(e) => handleInputChange('pages', e.target.value)}
                    placeholder="e.g., 123-145"
                  />
                </div>
              </>
            )}

            {(formData.type === ReferenceType.BOOK || formData.type === ReferenceType.BOOK_CHAPTER) && (
              <>
                <div>
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher || ''}
                    onChange={(e) => handleInputChange('publisher', e.target.value)}
                  />
                </div>
                {formData.type === ReferenceType.BOOK && (
                  <>
                    <div>
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={formData.isbn || ''}
                        onChange={(e) => handleInputChange('isbn', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edition">Edition</Label>
                      <Input
                        id="edition"
                        value={formData.edition || ''}
                        onChange={(e) => handleInputChange('edition', e.target.value)}
                      />
                    </div>
                  </>
                )}
                {formData.type === ReferenceType.BOOK_CHAPTER && (
                  <>
                    <div>
                      <Label htmlFor="chapter">Chapter Title</Label>
                      <Input
                        id="chapter"
                        value={formData.chapter || ''}
                        onChange={(e) => handleInputChange('chapter', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="editor">Editor(s)</Label>
                      <Input
                        id="editor"
                        value={formData.editor || ''}
                        onChange={(e) => handleInputChange('editor', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                value={formData.doi || ''}
                onChange={(e) => handleInputChange('doi', e.target.value)}
                placeholder="10.xxxx/xxxxx"
              />
            </div>

            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Reference' : 'Add Reference'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
