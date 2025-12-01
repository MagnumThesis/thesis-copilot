"use client"

import React, { useState, useEffect, lazy, Suspense } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./shadcn/sheet"
import { ScrollArea } from "./shadcn/scroll-area"
import { Badge } from "./shadcn/badge"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Separator } from "./shadcn/separator"
import { Skeleton } from "./shadcn/skeleton"
import { CitationStyle, Reference, ReferenceType } from "../../lib/ai-types"
import { ExportOptions } from "./export-options"
const BibliographyControls = lazy(() => import("./bibliography-controls").then(m => ({ default: m.BibliographyControls })))
const ExportOptionsComponent = lazy(() => import("./export-options").then(m => ({ default: m.ExportOptionsComponent })))
const ReferenceList = lazy(() => import("./reference-list").then(m => ({ default: m.ReferenceList })))
const ReferenceForm = lazy(() => import("./reference-form").then(m => ({ default: m.ReferenceForm })))
const CitationFormatter = lazy(() => import("./citation-formatter").then(m => ({ default: m.CitationFormatter })))
const BibliographyGenerator = lazy(() => import("./bibliography-generator").then(m => ({ default: m.BibliographyGenerator })))
import { BookOpen, FileText, Quote, Settings, Search, Plus, Filter, Sparkles } from "lucide-react"
const AISearcher = lazy(() => import("./ai-searcher").then(m => ({ default: m.AISearcher })))
import { CitationStyleEngine } from "../../worker/lib/citation-style-engine"

/**
 * Props for the Referencer component
 */
interface ReferencerProps {
  /** Whether the referencer sheet is open */
  isOpen: boolean
  /** Callback function to close the referencer */
  onClose: () => void
  /** Current conversation context */
  currentConversation: { 
    /** Title of the conversation */
    title: string; 
    /** ID of the conversation */
    id: string 
  }
}

/**
 * Available tabs in the referencer interface
 */
type ReferencerTab = 'references' | 'citations' | 'bibliography' | 'ai-searcher'

/**
 * Internal state for the Referencer component
 */
interface ReferencerState {
  /** Currently active tab */
  activeTab: ReferencerTab
  /** Current search query */
  searchQuery: string
  /** Currently selected citation style */
  selectedStyle: CitationStyle
  /** Current reference type filter */
  filterType: ReferenceType | 'all'
  /** Whether to show the reference form */
  showForm: boolean
  /** ID of the reference being edited, or null if adding new */
  editingReference: string | null
}

/**
 * Main reference management component that provides a comprehensive interface for handling academic references.
 * This component includes functionality for adding, editing, searching, and organizing references,
 * as well as generating citations and bibliographies in various formats.
 * 
 * @param {ReferencerProps} props - The props for the Referencer component
 * @param {boolean} props.isOpen - Whether the referencer sheet is open
 * @param {() => void} props.onClose - Callback function to close the referencer
 * @param {{title: string, id: string}} props.currentConversation - Current conversation context
 * 
 * @example
 * ```tsx
 * <Referencer
 *   isOpen={true}
 *   onClose={() => setReferencerOpen(false)}
 *   currentConversation={{ title: "My Thesis", id: "conv-123" }}
 * />
 * ```
 */
export const Referencer: React.FC<ReferencerProps> = ({ isOpen, onClose, currentConversation }) => {
  const [state, setState] = useState<ReferencerState>({
    activeTab: 'references',
    searchQuery: '',
    selectedStyle: CitationStyle.APA,
    filterType: 'all',
    showForm: false,
    editingReference: null
  })
  
  const [prefilledReferenceData, setPrefilledReferenceData] = useState<Partial<Reference> | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [references, setReferences] = useState<Reference[]>([])

  // Load saved citation style preference
  useEffect(() => {
    const savedStyle = localStorage.getItem('referencer-citation-style')
    if (savedStyle && Object.values(CitationStyle).includes(savedStyle as CitationStyle)) {
      setState(prev => ({ ...prev, selectedStyle: savedStyle as CitationStyle }))
    }
  }, [])

  // Save citation style preference
  useEffect(() => {
    localStorage.setItem('referencer-citation-style', state.selectedStyle)
  }, [state.selectedStyle])

  // Load references when component mounts or refreshKey changes
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const response = await fetch(`/api/referencer/references/${currentConversation.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.references) {
            setReferences(data.references)
          }
        }
      } catch (error) {
        console.error('Error loading references:', error)
      }
    }
    
    loadReferences()
  }, [currentConversation.id, refreshKey])

  const handleTabChange = (tab: ReferencerTab) => {
    setState(prev => ({ ...prev, activeTab: tab }))
  }

  const handleStyleChange = (style: CitationStyle) => {
    setState(prev => ({ ...prev, selectedStyle: style }))
  }

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }

  const handleFilterChange = (filterType: string) => {
    setState(prev => ({ ...prev, filterType: filterType as any }))
  }

  const handleAddReference = () => {
    setState(prev => ({
      ...prev,
      showForm: true,
      editingReference: null,
      activeTab: 'references'
    }))
  }

  const checkForDuplicateReference = async (reference: Partial<Reference>): Promise<Reference | null> => {
    try {
      // Get existing references for this conversation
      const response = await fetch(`/api/referencer/references/${currentConversation.id}`)
      
      if (!response.ok) {
        console.warn('Could not check for duplicates:', response.statusText)
        return null
      }

      const data = await response.json()
      
      if (data.success && data.references) {
        // Check for duplicates based on title, DOI, or URL
        const existingReference = data.references.find((existing: Reference) => {
          // Check DOI match (most reliable)
          if (reference.doi && existing.doi && 
              reference.doi.toLowerCase() === existing.doi.toLowerCase()) {
            return true
          }
          
          // Check URL match
          if (reference.url && existing.url && 
              reference.url.toLowerCase() === existing.url.toLowerCase()) {
            return true
          }
          
          // Check title similarity (exact match for now)
          if (reference.title && existing.title && 
              reference.title.toLowerCase().trim() === existing.title.toLowerCase().trim()) {
            return true
          }
          
          return false
        })
        
        return existingReference || null
      }
    } catch (error) {
      console.warn('Error checking for duplicates:', error)
    }
    
    return null
  }

  const createReferenceWithRetry = async (referenceData: any, maxRetries: number = 2): Promise<any> => {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('/api/referencer/references', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(referenceData)
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to add reference: ${response.statusText}`)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to add reference')
        }
        
        return result
      } catch (error: unknown) {
        lastError = error as Error
        
        // Don't retry on validation errors or client errors (4xx)
        if ((error as Error).message.includes('Validation failed') || 
            (error as Error).message.includes('400') || 
            (error as Error).message.includes('401') || 
            (error as Error).message.includes('403') || 
            (error as Error).message.includes('404')) {
          break
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError || new Error('Failed to create reference after retries')
  }

  const handleAddReferenceFromAI = async (reference: Partial<Reference>) => {
    try {
      // Reference is already added to DB by addReferenceFromSearch API
      // This callback just handles UI updates
      
      // Successfully added reference, switch to references tab to show it
      setState(prev => ({
        ...prev,
        activeTab: 'references',
        showForm: false,
        editingReference: null
      }))
      
      // Trigger refresh of reference list
      setRefreshKey(prev => prev + 1)
      
      // Show success feedback
      setSuccessMessage(`Reference "${reference.title}" added successfully!`)
      setTimeout(() => setSuccessMessage(null), 5000) // Clear after 5 seconds
      console.log('Reference added successfully:', reference)
      
    } catch (error) {
      console.error('Error adding reference from AI searcher:', error)
      
      // Fallback: show the form with pre-filled data so user can manually save
      setPrefilledReferenceData(reference)
      setState(prev => ({
        ...prev,
        showForm: true,
        editingReference: null,
        activeTab: 'references'
      }))
      
      // Show user-friendly error message
      const errorMessage = (error as Error).message || 'Unknown error occurred'
      alert(`Failed to add reference automatically: ${errorMessage}. Please review and save manually.`)
    }
  }

  const handleEditReference = (referenceId: string) => {
    setState(prev => ({
      ...prev,
      showForm: true,
      editingReference: referenceId,
      activeTab: 'references'
    }))
  }

  const generateBibliographyContent = (format: string, options?: ExportOptions) => {
    const style = options?.citationStyle || state.selectedStyle
    
    switch (format) {
      case 'bibtex':
        return references.map(ref => {
          const authors = ref.authors.map(a => typeof a === 'string' ? a : `${a.firstName} ${a.lastName}`).join(' and ')
          return `@article{${ref.id},
  author = {${authors}},
  title = {${ref.title}},
  journal = {${ref.journal || ''}},
  year = {${ref.publicationDate || ''}},
  doi = {${ref.doi || ''}},
  url = {${ref.url || ''}}
}`
        }).join('\n\n')
      
      case 'ris':
        return references.map(ref => {
          const type = ref.type === ReferenceType.JOURNAL_ARTICLE ? 'JOUR' : 'GEN'
          const authors = ref.authors.map(a => typeof a === 'string' ? a : `${a.lastName}, ${a.firstName}`)
          return `TY  - ${type}
${authors.map(a => `AU  - ${a}`).join('\n')}
TI  - ${ref.title}
JO  - ${ref.journal || ''}
PY  - ${ref.publicationDate || ''}
DO  - ${ref.doi || ''}
UR  - ${ref.url || ''}
ER  -`
        }).join('\n\n')
      
      case 'json':
        return JSON.stringify(references, null, 2)
      
      case 'csv':
        const headers = ['Title', 'Authors', 'Journal', 'Year', 'DOI', 'URL']
        const rows = references.map(ref => [
          ref.title,
          ref.authors.map(a => typeof a === 'string' ? a : `${a.firstName} ${a.lastName}`).join('; '),
          ref.journal || '',
          ref.publicationDate || '',
          ref.doi || '',
          ref.url || ''
        ])
        return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
      
      default:
        // Plain text bibliography
        return CitationStyleEngine.generateBibliography(references, style, 'alphabetical')
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleQuickExport = (format: 'bibtex' | 'ris' | 'json' | 'csv') => {
    if (references.length === 0) {
      alert('No references to export. Please add references first.')
      return
    }

    const content = generateBibliographyContent(format)
    const filename = `bibliography-${currentConversation.id}.${format}`
    const mimeTypes = {
      'bibtex': 'application/x-bibtex',
      'ris': 'application/x-research-info-systems',
      'json': 'application/json',
      'csv': 'text/csv'
    }
    
    downloadFile(content, filename, mimeTypes[format])
    setSuccessMessage(`Bibliography exported as ${format.toUpperCase()}`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleDetailedExport = (options: ExportOptions) => {
    if (references.length === 0) {
      alert('No references to export. Please add references first.')
      return
    }

    const content = generateBibliographyContent(options.format, options)
    const filename = `bibliography-${currentConversation.id}.${options.format}`
    const mimeTypes = {
      'bibtex': 'application/x-bibtex',
      'ris': 'application/x-research-info-systems',
      'json': 'application/json',
      'csv': 'text/csv'
    }
    
    downloadFile(content, filename, mimeTypes[options.format])
    setSuccessMessage(`Bibliography exported as ${options.format.toUpperCase()}`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleFormClose = () => {
    setState(prev => ({
      ...prev,
      showForm: false,
      editingReference: null
    }))
    setPrefilledReferenceData(null)
  }

  const getTabIcon = (tab: ReferencerTab) => {
    switch (tab) {
      case 'references':
        return <BookOpen className="h-4 w-4" />
      case 'citations':
        return <Quote className="h-4 w-4" />
      case 'bibliography':
        return <FileText className="h-4 w-4" />
      case 'ai-searcher':
        return <Sparkles className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const renderTabContent = () => {
    switch (state.activeTab) {
      case 'references':
        return (
          <div className="space-y-4">
            {state.showForm ? (
              <div className="border rounded-lg p-4">
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <ReferenceForm
                    conversationId={currentConversation.id}
                    referenceId={state.editingReference || undefined}
                    onClose={handleFormClose}
                    citationStyle={state.selectedStyle}
                    prefilledData={prefilledReferenceData || undefined}
                  />
                </Suspense>
              </div>
            ) : (
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <ReferenceList
                  key={refreshKey}
                  conversationId={currentConversation.id}
                  searchQuery={state.searchQuery}
                  filterType={state.filterType}
                  onEdit={handleEditReference}
                  citationStyle={state.selectedStyle}
                />
              </Suspense>
            )}
          </div>
        )

      case 'citations':
        return (
          <div className="space-y-4">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <CitationFormatter
                references={references}
                onFormattedCitations={(citations) => {
                  console.log('Formatted citations:', citations)
                  // Could add functionality to insert into document here
                }}
              />
            </Suspense>
          </div>
        )

      case 'bibliography':
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bibliography Generator
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate and export bibliographies in different formats
              </p>
              <div className="space-y-6">
                <Suspense fallback={<Skeleton className="h-16 w-full" />}>
                  <BibliographyControls 
                    citationStyle={state.selectedStyle}
                    onStyleChange={handleStyleChange}
                    onExport={handleQuickExport}
                  />
                </Suspense>
                <Separator />
                <Suspense fallback={<Skeleton className="h-20 w-full" />}>
                  <ExportOptionsComponent 
                    citationStyle={state.selectedStyle}
                    onExport={handleDetailedExport}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )

      case 'ai-searcher':
        return (
          <div className="space-y-4">
            <Suspense fallback={<Skeleton className="h-80 w-full" />}>
              <AISearcher
                conversationId={currentConversation.id}
                onAddReference={handleAddReferenceFromAI}
              />
            </Suspense>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[900px] w-full">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Reference Manager
              </SheetTitle>
              <SheetDescription>
                Manage references for "{currentConversation.title}"
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {state.selectedStyle.toUpperCase()}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Global Controls */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              value={state.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 text-sm"
            />
          </div>
          <Select value={state.filterType} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="journal_article">Journal Articles</SelectItem>
              <SelectItem value="book">Books</SelectItem>
              <SelectItem value="website">Websites</SelectItem>
              <SelectItem value="conference_paper">Conference Papers</SelectItem>
              <SelectItem value="thesis">Theses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={state.selectedStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-24">
              <Settings className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CitationStyle.APA}>APA</SelectItem>
              <SelectItem value={CitationStyle.MLA}>MLA</SelectItem>
              <SelectItem value={CitationStyle.CHICAGO}>Chicago</SelectItem>
              <SelectItem value={CitationStyle.HARVARD}>Harvard</SelectItem>
              <SelectItem value={CitationStyle.IEEE}>IEEE</SelectItem>
              <SelectItem value={CitationStyle.VANCOUVER}>Vancouver</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddReference} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Reference
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-green-800">
                <span className="font-medium">✓ {successMessage}</span>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-1 mb-4 border-b">
            {(['references', 'citations', 'bibliography', 'ai-searcher'] as const).map((tab) => (
              <Button
                key={tab}
                variant={state.activeTab === tab ? "default" : "ghost"}
                size="sm"
                onClick={() => handleTabChange(tab)}
                className="flex items-center gap-2 capitalize"
              >
                {getTabIcon(tab)}
                {tab === 'ai-searcher' ? 'AI Searcher' : tab}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
