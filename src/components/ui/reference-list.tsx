"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { 
  Reference, 
  ReferenceType, 
  ReferenceSearchOptions,
  Author 
} from "@/lib/ai-types"
import { Button } from "@/components/ui/shadcn/button"
import { Input } from "@/components/ui/shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select"
import { Badge } from "@/components/ui/shadcn/badge"
import { Separator } from "@/components/ui/shadcn/separator"
import { useVirtualScroll } from "@/hooks/use-virtual-scroll"
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Edit, 
  Trash2, 
  ExternalLink,
  Calendar,
  Users,
  BookOpen,
  FileText,
  Globe,
  GraduationCap,
  Briefcase,
  Shield,
  MoreHorizontal
} from "lucide-react"

interface ReferenceListProps {
  references: Reference[]
  onReferenceSelect: (reference: Reference) => void
  onReferenceEdit: (reference: Reference) => void
  onReferenceDelete: (referenceId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  filterType: ReferenceType | 'all'
  onFilterChange: (type: ReferenceType | 'all') => void
  isLoading?: boolean
}

type SortOption = 'title' | 'author' | 'date' | 'created' | 'type'
type SortDirection = 'asc' | 'desc'

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

export const ReferenceList: React.FC<ReferenceListProps> = ({
  references,
  onReferenceSelect,
  onReferenceEdit,
  onReferenceDelete,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  isLoading = false
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  // Update container height on mount and resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const availableHeight = window.innerHeight - rect.top - 100 // Leave some margin
        setContainerHeight(Math.max(300, Math.min(600, availableHeight)))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Filter references based on search query and type filter
  const filteredReferences = useMemo(() => {
    return references.filter(reference => {
      // Type filter
      if (filterType !== 'all' && reference.type !== filterType) return false
      
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const searchableText = [
          reference.title,
          reference.authors.map(author => `${author.firstName} ${author.lastName}`).join(' '),
          reference.journal || '',
          reference.publisher || '',
          reference.notes || '',
          ...reference.tags
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(query)) return false
      }
      
      return true
    })
  }, [references, searchQuery, filterType])

  // Sort references
  const sortedReferences = useMemo(() => {
    return [...filteredReferences].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'author':
          const aAuthor = a.authors[0] ? `${a.authors[0].lastName}, ${a.authors[0].firstName}` : ''
          const bAuthor = b.authors[0] ? `${b.authors[0].lastName}, ${b.authors[0].firstName}` : ''
          comparison = aAuthor.localeCompare(bAuthor)
          break
        case 'date':
          const aDate = a.publicationDate ? new Date(a.publicationDate).getTime() : 0
          const bDate = b.publicationDate ? new Date(b.publicationDate).getTime() : 0
          comparison = aDate - bDate
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredReferences, sortBy, sortDirection])

  // Virtual scrolling for large lists
  const ITEM_HEIGHT = 140 // Approximate height of each reference item
  const virtualScroll = useVirtualScroll(sortedReferences, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: containerHeight - 50, // Account for padding
    overscan: 3
  })

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('asc')
    }
  }

  const formatAuthors = (authors: Author[]): string => {
    if (authors.length === 0) return 'No authors'
    if (authors.length === 1) {
      const author = authors[0]
      return `${author.lastName}, ${author.firstName}${author.middleName ? ` ${author.middleName}` : ''}${author.suffix ? ` ${author.suffix}` : ''}`
    }
    if (authors.length === 2) {
      return `${authors[0].lastName}, ${authors[0].firstName} & ${authors[1].lastName}, ${authors[1].firstName}`
    }
    return `${authors[0].lastName}, ${authors[0].firstName} et al.`
  }

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'No date'
    return new Date(date).getFullYear().toString()
  }

  const getPublicationInfo = (reference: Reference): string => {
    switch (reference.type) {
      case ReferenceType.JOURNAL_ARTICLE:
        return reference.journal || 'Unknown journal'
      case ReferenceType.BOOK:
      case ReferenceType.BOOK_CHAPTER:
        return reference.publisher || 'Unknown publisher'
      case ReferenceType.CONFERENCE_PAPER:
        return reference.journal || 'Unknown conference'
      case ReferenceType.THESIS:
        return reference.publisher || 'Unknown institution'
      case ReferenceType.WEBSITE:
        return reference.url ? new URL(reference.url).hostname : 'Unknown website'
      case ReferenceType.REPORT:
        return reference.publisher || 'Unknown organization'
      default:
        return ''
    }
  }

  const handleReferenceClick = (reference: Reference) => {
    setSelectedReferenceId(reference.id)
    onReferenceSelect(reference)
  }

  const handleEditClick = (e: React.MouseEvent, reference: Reference) => {
    e.stopPropagation()
    onReferenceEdit(reference)
  }

  const handleDeleteClick = (e: React.MouseEvent, referenceId: string) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this reference? This action cannot be undone.')) {
      onReferenceDelete(referenceId)
    }
  }

  const handleExternalLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading references...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search references by title, author, journal..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-2">
          {/* Type Filter */}
          <Select value={filterType} onValueChange={(value: ReferenceType | 'all') => onFilterChange(value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(REFERENCE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select value={sortBy} onValueChange={(value: SortOption) => handleSortChange(value)}>
            <SelectTrigger className="w-[140px]">
              {sortDirection === 'asc' ? (
                <SortAsc className="h-4 w-4 mr-2" />
              ) : (
                <SortDesc className="h-4 w-4 mr-2" />
              )}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="author">Author</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {sortedReferences.length} of {references.length} references
            {searchQuery && ` matching "${searchQuery}"`}
            {filterType !== 'all' && ` (${REFERENCE_TYPE_LABELS[filterType]})`}
          </span>
        </div>
      </div>

      <Separator />

      {/* Reference List */}
      {sortedReferences.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">
            {references.length === 0 ? (
              <>
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No references yet</p>
                <p className="text-sm">Add your first reference to get started</p>
              </>
            ) : (
              <>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No matching references</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div 
          {...virtualScroll.scrollElementProps}
          className="border rounded-lg"
          style={{
            ...virtualScroll.scrollElementProps.style,
            height: containerHeight - 50
          }}
        >
          <div {...virtualScroll.containerProps}>
            {virtualScroll.virtualItems.map(({ index, item: reference, offsetTop }) => {
              const IconComponent = REFERENCE_TYPE_ICONS[reference.type]
              const isSelected = selectedReferenceId === reference.id
              
              return (
                <div
                  key={reference.id}
                  className={`absolute w-full p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                    isSelected ? 'bg-primary/5 border-primary' : 'border-border'
                  }`}
                  style={{
                    top: offsetTop,
                    height: ITEM_HEIGHT
                  }}
                  onClick={() => handleReferenceClick(reference)}
                >
                  <div className="flex items-start justify-between gap-3 h-full">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Reference Type Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Reference Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title */}
                        <h3 className="font-medium text-sm leading-tight line-clamp-2">
                          {reference.title}
                        </h3>

                        {/* Authors */}
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          <Users className="h-3 w-3 inline mr-1" />
                          {formatAuthors(reference.authors)}
                        </p>

                        {/* Publication Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="line-clamp-1">
                            {getPublicationInfo(reference)}
                          </span>
                          {reference.publicationDate && (
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Calendar className="h-3 w-3" />
                              {formatDate(reference.publicationDate)}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        {reference.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {reference.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                            {reference.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                +{reference.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {reference.url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => handleExternalLinkClick(e, reference.url!)}
                          title="Open URL"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleEditClick(e, reference)}
                        title="Edit reference"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => handleDeleteClick(e, reference.id)}
                        title="Delete reference"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Reference Type Badge */}
                  <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {REFERENCE_TYPE_LABELS[reference.type]}
                    </Badge>
                    
                    {/* Metadata Confidence */}
                    {reference.metadataConfidence < 1.0 && (
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round(reference.metadataConfidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}