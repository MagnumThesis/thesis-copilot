"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/shadcn/button"
import { Input } from "@/components/ui/shadcn/input"
import { Label } from "@/components/ui/shadcn/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select"
import { Badge } from "@/components/ui/shadcn/badge"
import { Separator } from "@/components/ui/shadcn/separator"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { 
  Edit3, 
  X, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Copy,
  Calendar,
  Users,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  Briefcase,
  Shield,
  MoreHorizontal,
  Tag
} from "lucide-react"
import { 
  Reference, 
  ReferenceType, 
  Author, 
  CitationStyle
} from "@/lib/ai-types"

interface ReferenceDetailProps {
  reference: Reference
  onEdit: (reference: Reference) => void
  onDelete: (referenceId: string) => void
  onTagAdd: (referenceId: string, tag: string) => void
  onTagRemove: (referenceId: string, tag: string) => void
  onClose: () => void

  isLoading?: boolean
}

interface ReferenceDetailState {
  editingTags: boolean
  newTag: string
  selectedCitationStyle: CitationStyle
  showDeleteConfirmation: boolean
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

const REFERENCE_TYPE_ICONS: Record<ReferenceType, React.ComponentType<{ className?: string }>> = {
  [ReferenceType.JOURNAL_ARTICLE]: FileText,
  [ReferenceType.BOOK]: BookOpen,
  [ReferenceType.BOOK_CHAPTER]: BookOpen,
  [ReferenceType.CONFERENCE_PAPER]: Users,
  [ReferenceType.THESIS]: GraduationCap,
  [ReferenceType.WEBSITE]: Globe,
  [ReferenceType.REPORT]: Briefcase,
  [ReferenceType.PATENT]: Shield,
  [ReferenceType.OTHER]: MoreHorizontal
}

const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  [CitationStyle.APA]: 'APA (7th Edition)',
  [CitationStyle.MLA]: 'MLA (9th Edition)',
  [CitationStyle.CHICAGO]: 'Chicago (17th Edition)',
  [CitationStyle.HARVARD]: 'Harvard',
  [CitationStyle.IEEE]: 'IEEE',
  [CitationStyle.VANCOUVER]: 'Vancouver'
}

export const ReferenceDetail: React.FC<ReferenceDetailProps> = ({
  reference,
  onEdit,
  onDelete,
  onTagAdd,
  onTagRemove,
  onClose,
  isLoading = false
}) => {
  const [state, setState] = useState<ReferenceDetailState>({
    editingTags: false,
    newTag: '',
    selectedCitationStyle: CitationStyle.APA,
    showDeleteConfirmation: false
  })

  const IconComponent = REFERENCE_TYPE_ICONS[reference.type]

  const formatAuthors = (authors: Author[]): string => {
    if (authors.length === 0) return 'No authors'
    if (authors.length === 1) {
      const author = authors[0]
      return `${author.firstName} ${author.middleName ? author.middleName + ' ' : ''}${author.lastName}${author.suffix ? ', ' + author.suffix : ''}`
    }
    if (authors.length === 2) {
      return `${authors[0].firstName} ${authors[0].lastName} & ${authors[1].firstName} ${authors[1].lastName}`
    }
    return `${authors[0].firstName} ${authors[0].lastName} et al.`
  }

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'No date'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }



  const generateCitation = (style: CitationStyle): string => {
    const authors = reference.authors
    const year = reference.publicationDate ? new Date(reference.publicationDate).getFullYear() : 'n.d.'
    const title = reference.title

    switch (style) {
      case CitationStyle.APA:
        if (authors.length === 0) {
          return `${title} (${year}).`
        } else if (authors.length === 1) {
          const author = authors[0]
          return `${author.lastName}, ${author.firstName[0]}. (${year}). ${title}.`
        } else if (authors.length <= 20) {
          const authorList = authors.map(a => `${a.lastName}, ${a.firstName[0]}.`).join(', ')
          return `${authorList} (${year}). ${title}.`
        } else {
          const firstAuthor = authors[0]
          return `${firstAuthor.lastName}, ${firstAuthor.firstName[0]}., et al. (${year}). ${title}.`
        }

      case CitationStyle.MLA:
        if (authors.length === 0) {
          return `"${title}." ${year}.`
        } else if (authors.length === 1) {
          const author = authors[0]
          return `${author.lastName}, ${author.firstName}. "${title}." ${year}.`
        } else if (authors.length === 2) {
          return `${authors[0].lastName}, ${authors[0].firstName}, and ${authors[1].firstName} ${authors[1].lastName}. "${title}." ${year}.`
        } else {
          const firstAuthor = authors[0]
          return `${firstAuthor.lastName}, ${firstAuthor.firstName}, et al. "${title}." ${year}.`
        }

      case CitationStyle.CHICAGO:
        if (authors.length === 0) {
          return `"${title}." ${year}.`
        } else if (authors.length === 1) {
          const author = authors[0]
          return `${author.lastName}, ${author.firstName}. "${title}." ${year}.`
        } else {
          const authorList = authors.map((a, i) => 
            i === 0 ? `${a.lastName}, ${a.firstName}` : `${a.firstName} ${a.lastName}`
          ).join(', ')
          return `${authorList}. "${title}." ${year}.`
        }

      case CitationStyle.HARVARD:
        if (authors.length === 0) {
          return `${title} ${year}.`
        } else if (authors.length === 1) {
          const author = authors[0]
          return `${author.lastName}, ${author.firstName[0]} ${year}, '${title}'.`
        } else {
          const authorList = authors.map(a => `${a.lastName}, ${a.firstName[0]}`).join(', ')
          return `${authorList} ${year}, '${title}'.`
        }

      case CitationStyle.IEEE:
        if (authors.length === 0) {
          return `"${title}," ${year}.`
        } else {
          const authorList = authors.map(a => `${a.firstName[0]}. ${a.lastName}`).join(', ')
          return `${authorList}, "${title}," ${year}.`
        }

      case CitationStyle.VANCOUVER:
        if (authors.length === 0) {
          return `${title}. ${year}.`
        } else if (authors.length <= 6) {
          const authorList = authors.map(a => `${a.lastName} ${a.firstName[0]}`).join(', ')
          return `${authorList}. ${title}. ${year}.`
        } else {
          const firstThree = authors.slice(0, 3).map(a => `${a.lastName} ${a.firstName[0]}`).join(', ')
          return `${firstThree}, et al. ${title}. ${year}.`
        }

      default:
        return `${formatAuthors(authors)} (${year}). ${title}.`
    }
  }

  const handleAddTag = () => {
    if (state.newTag.trim()) {
      onTagAdd(reference.id, state.newTag.trim())
      setState(prev => ({ ...prev, newTag: '' }))
      toast.success('Tag added successfully')
    }
  }

  const handleRemoveTag = (tag: string) => {
    onTagRemove(reference.id, tag)
    toast.success('Tag removed successfully')
  }

  const handleCopyCitation = () => {
    const citation = generateCitation(state.selectedCitationStyle)
    navigator.clipboard.writeText(citation)
    toast.success('Citation copied to clipboard')
  }

  const handleExternalLink = () => {
    if (reference.url) {
      window.open(reference.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDelete = () => {
    setState(prev => ({ ...prev, showDeleteConfirmation: true }))
  }

  const confirmDelete = () => {
    onDelete(reference.id)
    setState(prev => ({ ...prev, showDeleteConfirmation: false }))
    toast.success('Reference deleted successfully')
  }

  const cancelDelete = () => {
    setState(prev => ({ ...prev, showDeleteConfirmation: false }))
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <IconComponent className="h-6 w-6 text-muted-foreground" />
          <div>
            <h2 className="text-xl font-semibold line-clamp-1">{reference.title}</h2>
            <p className="text-sm text-muted-foreground">
              {REFERENCE_TYPE_LABELS[reference.type]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(reference)}
            disabled={isLoading}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                <p className="mt-1 text-sm">{reference.title || 'No title'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Authors</Label>
                <p className="mt-1 text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {formatAuthors(reference.authors)}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Publication Date</Label>
                <p className="mt-1 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(reference.publicationDate)}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                <Badge variant="outline" className="mt-1">
                  {REFERENCE_TYPE_LABELS[reference.type]}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Publication Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Publication Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reference.journal && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Journal/Conference</Label>
                  <p className="mt-1 text-sm">{reference.journal}</p>
                </div>
              )}
              
              {reference.publisher && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Publisher</Label>
                  <p className="mt-1 text-sm">{reference.publisher}</p>
                </div>
              )}
              
              {reference.volume && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Volume</Label>
                  <p className="mt-1 text-sm">{reference.volume}</p>
                </div>
              )}
              
              {reference.issue && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Issue</Label>
                  <p className="mt-1 text-sm">{reference.issue}</p>
                </div>
              )}
              
              {reference.pages && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pages</Label>
                  <p className="mt-1 text-sm">{reference.pages}</p>
                </div>
              )}
              
              {reference.edition && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Edition</Label>
                  <p className="mt-1 text-sm">{reference.edition}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Identifiers */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Identifiers</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reference.doi && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">DOI</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-mono">{reference.doi}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`https://doi.org/${reference.doi}`, '_blank')}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {reference.isbn && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">ISBN</Label>
                  <p className="mt-1 text-sm font-mono">{reference.isbn}</p>
                </div>
              )}
              
              {reference.url && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-muted-foreground">URL</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-mono truncate flex-1">{reference.url}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExternalLink}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Tags</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, editingTags: !prev.editingTags }))}
              >
                <Tag className="h-4 w-4 mr-2" />
                {state.editingTags ? 'Done' : 'Manage Tags'}
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {reference.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                    {state.editingTags && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {reference.tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags added</p>
                )}
              </div>
              
              {state.editingTags && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new tag..."
                    value={state.newTag}
                    onChange={(e) => setState(prev => ({ ...prev, newTag: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1"
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Citation Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Citation Preview</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium">Citation Style</Label>
                <Select
                  value={state.selectedCitationStyle}
                  onValueChange={(value: CitationStyle) => 
                    setState(prev => ({ ...prev, selectedCitationStyle: value }))
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CITATION_STYLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-mono leading-relaxed flex-1">
                    {generateCitation(state.selectedCitationStyle)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCitation}
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {reference.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notes</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{reference.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Metadata</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <Label className="text-xs font-medium">Created</Label>
                <p className="mt-1">{formatDate(reference.createdAt)}</p>
              </div>
              
              <div>
                <Label className="text-xs font-medium">Last Modified</Label>
                <p className="mt-1">{formatDate(reference.updatedAt)}</p>
              </div>
              
              <div>
                <Label className="text-xs font-medium">Metadata Confidence</Label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${reference.metadataConfidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">
                    {Math.round(reference.metadataConfidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      {state.showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Reference</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this reference? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelDelete}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
