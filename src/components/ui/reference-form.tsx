"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/shadcn/button"
import { Input } from "@/components/ui/shadcn/input"
import { Label } from "@/components/ui/shadcn/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select"
import { Textarea } from "@/components/ui/shadcn/textarea"
import { Badge } from "@/components/ui/shadcn/badge"
import { Separator } from "@/components/ui/shadcn/separator"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { AlertCircle, Plus, X, Link, FileText, Loader2 } from "lucide-react"
import { 
  Reference, 
  ReferenceFormData, 
  ReferenceType, 
  Author, 
  ValidationError,
  MetadataExtractionRequest,
  MetadataExtractionResponse
} from "@/lib/ai-types"

interface ReferenceFormProps {
  reference?: Reference
  onSave: (reference: ReferenceFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

interface ReferenceFormState {
  formData: ReferenceFormData
  importMode: 'url' | 'doi' | 'manual'
  validationErrors: ValidationError[]
  isExtracting: boolean
  extractionSource: string
}

const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  [ReferenceType.JOURNAL_ARTICLE]: 'Journal Article',
  [ReferenceType.BOOK]: 'Book',
  [ReferenceType.BOOK_CHAPTER]: 'Book Chapter',
  [ReferenceType.CONFERENCE_PAPER]: 'Conference Paper',
  [ReferenceType.THESIS]: 'Thesis',
  [ReferenceType.WEBSITE]: 'Website',
  [ReferenceType.REPORT]: 'Report',
  [ReferenceType.PATENT]: 'Patent',
  [ReferenceType.OTHER]: 'Other'
}

const REQUIRED_FIELDS_BY_TYPE: Record<ReferenceType, string[]> = {
  [ReferenceType.JOURNAL_ARTICLE]: ['title', 'authors', 'journal', 'publicationDate'],
  [ReferenceType.BOOK]: ['title', 'authors', 'publisher', 'publicationDate'],
  [ReferenceType.BOOK_CHAPTER]: ['title', 'authors', 'editor', 'publisher', 'publicationDate'],
  [ReferenceType.CONFERENCE_PAPER]: ['title', 'authors', 'publicationDate'],
  [ReferenceType.THESIS]: ['title', 'authors', 'publisher', 'publicationDate'],
  [ReferenceType.WEBSITE]: ['title', 'url'],
  [ReferenceType.REPORT]: ['title', 'authors', 'publisher', 'publicationDate'],
  [ReferenceType.PATENT]: ['title', 'authors', 'publicationDate'],
  [ReferenceType.OTHER]: ['title', 'authors']
}

export const ReferenceForm: React.FC<ReferenceFormProps> = ({
  reference,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [state, setState] = useState<ReferenceFormState>({
    formData: {
      type: ReferenceType.JOURNAL_ARTICLE,
      title: '',
      authors: [],
      publicationDate: '',
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
      accessDate: '',
      notes: '',
      tags: []
    },
    importMode: 'manual',
    validationErrors: [],
    isExtracting: false,
    extractionSource: ''
  })

  // Initialize form data from reference prop
  useEffect(() => {
    if (reference) {
      setState(prev => ({
        ...prev,
        formData: {
          type: reference.type,
          title: reference.title,
          authors: reference.authors,
          publicationDate: reference.publicationDate ? reference.publicationDate.toISOString().split('T')[0] : '',
          url: reference.url || '',
          doi: reference.doi || '',
          journal: reference.journal || '',
          volume: reference.volume || '',
          issue: reference.issue || '',
          pages: reference.pages || '',
          publisher: reference.publisher || '',
          isbn: reference.isbn || '',
          edition: reference.edition || '',
          chapter: reference.chapter || '',
          editor: reference.editor || '',
          accessDate: reference.accessDate ? reference.accessDate.toISOString().split('T')[0] : '',
          notes: reference.notes || '',
          tags: reference.tags
        }
      }))
    }
  }, [reference])

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = []
    const requiredFields = REQUIRED_FIELDS_BY_TYPE[state.formData.type]

    // Check required fields
    requiredFields.forEach(field => {
      if (field === 'authors') {
        if (state.formData.authors.length === 0) {
          errors.push({
            field: 'authors',
            message: 'At least one author is required',
            severity: 'error'
          })
        }
      } else {
        const value = state.formData[field as keyof ReferenceFormData]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push({
            field,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required for ${REFERENCE_TYPE_LABELS[state.formData.type]}`,
            severity: 'error'
          })
        }
      }
    })

    // Validate URL format
    if (state.formData.url && !isValidUrl(state.formData.url)) {
      errors.push({
        field: 'url',
        message: 'Please enter a valid URL',
        severity: 'error'
      })
    }

    // Validate DOI format
    if (state.formData.doi && !isValidDoi(state.formData.doi)) {
      errors.push({
        field: 'doi',
        message: 'Please enter a valid DOI (e.g., 10.1000/182)',
        severity: 'error'
      })
    }

    // Validate authors
    state.formData.authors.forEach((author, index) => {
      if (!author.firstName.trim() || !author.lastName.trim()) {
        errors.push({
          field: `authors.${index}`,
          message: `Author ${index + 1}: First name and last name are required`,
          severity: 'error'
        })
      }
    })

    return errors
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  const isValidDoi = (doi: string): boolean => {
    return /^10\.\d{4,}\/.*/.test(doi)
  }

  const handleExtractMetadata = async () => {
    if (!state.extractionSource.trim()) {
      toast.error('Please enter a URL or DOI to extract metadata')
      return
    }

    setState(prev => ({ ...prev, isExtracting: true }))

    try {
      const extractionType = state.importMode === 'url' ? 'url' : 'doi'
      const request: MetadataExtractionRequest = {
        source: state.extractionSource.trim(),
        type: extractionType,
        conversationId: '' // Will be set by the parent component
      }

      const response = await fetch('/api/referencer/extract-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Failed to extract metadata: ${response.statusText}`)
      }

      const result: MetadataExtractionResponse = await response.json()

      if (!result.success || !result.metadata) {
        throw new Error(result.error || 'Failed to extract metadata')
      }

      // Update form data with extracted metadata
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          title: result.metadata?.title || prev.formData.title,
          authors: result.metadata?.authors || prev.formData.authors,
          publicationDate: result.metadata?.publicationDate 
            ? result.metadata.publicationDate.toISOString().split('T')[0] 
            : prev.formData.publicationDate,
          journal: result.metadata?.journal || prev.formData.journal,
          volume: result.metadata?.volume || prev.formData.volume,
          issue: result.metadata?.issue || prev.formData.issue,
          pages: result.metadata?.pages || prev.formData.pages,
          publisher: result.metadata?.publisher || prev.formData.publisher,
          doi: result.metadata?.doi || prev.formData.doi,
          isbn: result.metadata?.isbn || prev.formData.isbn,
          url: extractionType === 'url' ? state.extractionSource : (result.metadata?.url || prev.formData.url),
          type: result.metadata?.type || prev.formData.type
        }
      }))

      toast.success(`Metadata extracted successfully (confidence: ${Math.round((result.metadata.confidence || 0) * 100)}%)`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to extract metadata')
    } finally {
      setState(prev => ({ ...prev, isExtracting: false }))
    }
  }

  const handleAddAuthor = () => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        authors: [...prev.formData.authors, { firstName: '', lastName: '', middleName: '', suffix: '' }]
      }
    }))
  }

  const handleRemoveAuthor = (index: number) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        authors: prev.formData.authors.filter((_, i) => i !== index)
      }
    }))
  }

  const handleAuthorChange = (index: number, field: keyof Author, value: string) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        authors: prev.formData.authors.map((author, i) => 
          i === index ? { ...author, [field]: value } : author
        )
      }
    }))
  }

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !state.formData.tags.includes(tag.trim())) {
      setState(prev => ({
        ...prev,
        formData: {
          ...prev.formData,
          tags: [...prev.formData.tags, tag.trim()]
        }
      }))
    }
  }

  const handleRemoveTag = (tag: string) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        tags: prev.formData.tags.filter(t => t !== tag)
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    setState(prev => ({ ...prev, validationErrors: errors }))

    if (errors.filter(e => e.severity === 'error').length > 0) {
      toast.error('Please fix the validation errors before saving')
      return
    }

    try {
      await onSave(state.formData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save reference')
    }
  }

  const getFieldError = (field: string): ValidationError | undefined => {
    return state.validationErrors.find(error => error.field === field)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Import Mode Selection */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={state.importMode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, importMode: 'url' }))}
          >
            <Link className="h-4 w-4" />
            URL
          </Button>
          <Button
            type="button"
            variant={state.importMode === 'doi' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, importMode: 'doi' }))}
          >
            <FileText className="h-4 w-4" />
            DOI
          </Button>
          <Button
            type="button"
            variant={state.importMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setState(prev => ({ ...prev, importMode: 'manual' }))}
          >
            Manual Entry
          </Button>
        </div>

        {/* URL/DOI Import */}
        {(state.importMode === 'url' || state.importMode === 'doi') && (
          <div className="flex gap-2">
            <Input
              placeholder={state.importMode === 'url' ? 'Enter URL...' : 'Enter DOI...'}
              value={state.extractionSource}
              onChange={(e) => setState(prev => ({ ...prev, extractionSource: e.target.value }))}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleExtractMetadata}
              disabled={state.isExtracting || !state.extractionSource.trim()}
            >
              {state.isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Extract'
              )}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      <ScrollArea className="h-[60vh]">
        <div className="space-y-4 pr-4">
          {/* Reference Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Reference Type *</Label>
            <Select
              value={state.formData.type}
              onValueChange={(value: ReferenceType) => 
                setState(prev => ({ 
                  ...prev, 
                  formData: { ...prev.formData, type: value },
                  validationErrors: prev.validationErrors.filter(e => e.field !== 'type')
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REFERENCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('type') && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('type')?.message}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={state.formData.title}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                formData: { ...prev.formData, title: e.target.value },
                validationErrors: prev.validationErrors.filter(e => e.field !== 'title')
              }))}
              placeholder="Enter reference title..."
            />
            {getFieldError('title') && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('title')?.message}
              </div>
            )}
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Authors *</Label>
              <Button type="button" size="sm" variant="outline" onClick={handleAddAuthor}>
                <Plus className="h-4 w-4" />
                Add Author
              </Button>
            </div>
            
            {state.formData.authors.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No authors added. Click "Add Author" to add the first author.
              </div>
            )}

            {state.formData.authors.map((author, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Author {index + 1}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveAuthor(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`author-${index}-firstName`}>First Name *</Label>
                    <Input
                      id={`author-${index}-firstName`}
                      value={author.firstName}
                      onChange={(e) => handleAuthorChange(index, 'firstName', e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`author-${index}-lastName`}>Last Name *</Label>
                    <Input
                      id={`author-${index}-lastName`}
                      value={author.lastName}
                      onChange={(e) => handleAuthorChange(index, 'lastName', e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`author-${index}-middleName`}>Middle Name</Label>
                    <Input
                      id={`author-${index}-middleName`}
                      value={author.middleName || ''}
                      onChange={(e) => handleAuthorChange(index, 'middleName', e.target.value)}
                      placeholder="Middle name"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`author-${index}-suffix`}>Suffix</Label>
                    <Input
                      id={`author-${index}-suffix`}
                      value={author.suffix || ''}
                      onChange={(e) => handleAuthorChange(index, 'suffix', e.target.value)}
                      placeholder="Jr., Sr., PhD, etc."
                    />
                  </div>
                </div>
                
                {getFieldError(`authors.${index}`) && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(`authors.${index}`)?.message}
                  </div>
                )}
              </div>
            ))}
            
            {getFieldError('authors') && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('authors')?.message}
              </div>
            )}
          </div>

          {/* Publication Date */}
          <div className="space-y-2">
            <Label htmlFor="publicationDate">Publication Date</Label>
            <Input
              id="publicationDate"
              type="date"
              value={state.formData.publicationDate}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                formData: { ...prev.formData, publicationDate: e.target.value },
                validationErrors: prev.validationErrors.filter(e => e.field !== 'publicationDate')
              }))}
            />
            {getFieldError('publicationDate') && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('publicationDate')?.message}
              </div>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={state.formData.url}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                formData: { ...prev.formData, url: e.target.value },
                validationErrors: prev.validationErrors.filter(e => e.field !== 'url')
              }))}
              placeholder="https://..."
            />
            {getFieldError('url') && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('url')?.message}
              </div>
            )}
          </div>

          {/* DOI */}
          <div className="space-y-2">
            <Label htmlFor="doi">DOI</Label>
            <Input
              id="doi"
              value={state.formData.doi}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                formData: { ...prev.formData, doi: e.target.value },
                validationErrors: prev.validationErrors.filter(e => e.field !== 'doi')
              }))}
              placeholder="10.1000/182"
            />
            {getFieldError('doi') && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-3 w-3" />
                {getFieldError('doi')?.message}
              </div>
            )}
          </div>

          {/* Type-specific fields */}
          {(state.formData.type === ReferenceType.JOURNAL_ARTICLE || 
            state.formData.type === ReferenceType.CONFERENCE_PAPER) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="journal">
                  {state.formData.type === ReferenceType.JOURNAL_ARTICLE ? 'Journal' : 'Conference'} *
                </Label>
                <Input
                  id="journal"
                  value={state.formData.journal}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    formData: { ...prev.formData, journal: e.target.value },
                    validationErrors: prev.validationErrors.filter(e => e.field !== 'journal')
                  }))}
                  placeholder={state.formData.type === ReferenceType.JOURNAL_ARTICLE ? 'Journal name' : 'Conference name'}
                />
                {getFieldError('journal') && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('journal')?.message}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    value={state.formData.volume}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      formData: { ...prev.formData, volume: e.target.value }
                    }))}
                    placeholder="Vol."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue</Label>
                  <Input
                    id="issue"
                    value={state.formData.issue}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      formData: { ...prev.formData, issue: e.target.value }
                    }))}
                    placeholder="No."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pages">Pages</Label>
                  <Input
                    id="pages"
                    value={state.formData.pages}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      formData: { ...prev.formData, pages: e.target.value }
                    }))}
                    placeholder="1-10"
                  />
                </div>
              </div>
            </>
          )}

          {(state.formData.type === ReferenceType.BOOK || 
            state.formData.type === ReferenceType.BOOK_CHAPTER ||
            state.formData.type === ReferenceType.REPORT ||
            state.formData.type === ReferenceType.THESIS) && (
            <div className="space-y-2">
              <Label htmlFor="publisher">Publisher *</Label>
              <Input
                id="publisher"
                value={state.formData.publisher}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  formData: { ...prev.formData, publisher: e.target.value },
                  validationErrors: prev.validationErrors.filter(e => e.field !== 'publisher')
                }))}
                placeholder="Publisher name"
              />
              {getFieldError('publisher') && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('publisher')?.message}
                </div>
              )}
            </div>
          )}

          {state.formData.type === ReferenceType.BOOK_CHAPTER && (
            <>
              <div className="space-y-2">
                <Label htmlFor="editor">Editor *</Label>
                <Input
                  id="editor"
                  value={state.formData.editor}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    formData: { ...prev.formData, editor: e.target.value },
                    validationErrors: prev.validationErrors.filter(e => e.field !== 'editor')
                  }))}
                  placeholder="Editor name"
                />
                {getFieldError('editor') && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError('editor')?.message}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter</Label>
                <Input
                  id="chapter"
                  value={state.formData.chapter}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    formData: { ...prev.formData, chapter: e.target.value }
                  }))}
                  placeholder="Chapter title or number"
                />
              </div>
            </>
          )}

          {state.formData.type === ReferenceType.BOOK && (
            <>
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={state.formData.isbn}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    formData: { ...prev.formData, isbn: e.target.value }
                  }))}
                  placeholder="978-0-123456-78-9"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edition">Edition</Label>
                <Input
                  id="edition"
                  value={state.formData.edition}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    formData: { ...prev.formData, edition: e.target.value }
                  }))}
                  placeholder="2nd edition"
                />
              </div>
            </>
          )}

          {state.formData.type === ReferenceType.WEBSITE && (
            <div className="space-y-2">
              <Label htmlFor="accessDate">Access Date</Label>
              <Input
                id="accessDate"
                type="date"
                value={state.formData.accessDate}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  formData: { ...prev.formData, accessDate: e.target.value }
                }))}
              />
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {state.formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-auto p-0 ml-1"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add tag and press Enter..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={state.formData.notes}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                formData: { ...prev.formData, notes: e.target.value }
              }))}
              placeholder="Additional notes about this reference..."
              rows={3}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            reference ? 'Update Reference' : 'Save Reference'
          )}
        </Button>
      </div>
    </form>
  )
}