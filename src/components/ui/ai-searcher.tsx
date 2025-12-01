"use client"

import React, { useState } from "react"
import { Reference, ExtractedContent } from "../../lib/ai-types"
import { QueryRefinement, RefinedQuery } from "../../worker/lib/query-generation-engine"
import { DuplicateDetectionEngine, DuplicateDetectionOptions, DuplicateGroup } from "../../worker/lib/duplicate-detection-engine"
import { ScholarSearchResult, SearchFilters, SearchResultFeedback, SearchSessionFeedback } from "../../lib/ai-types"
import { useSearchResultTracking } from "../../hooks/useSearchAnalytics"
import { usePrivacyManager } from "../../hooks/usePrivacyManager"

// Import our extracted components
import { SearchHeader } from "./ai-searcher/search-header"
import { PrivacyManagement } from "./ai-searcher/privacy-management"
import { ContentSourceManagement } from "./ai-searcher/content-source-management"
import { QueryManagement } from "./ai-searcher/query-management"
import { ResultsManagement } from "./ai-searcher/results-management"
import { Badge } from "./shadcn/badge"

// Import official SVG files from the logos folder
// Use Vite URL import to get asset paths (works with Vite / bundlers that support ?url)
// Resolve SVG asset URLs using import.meta (works with Vite)
const crossrefLogo = new URL('./logos/crossref.svg', import.meta.url).href
const arxivLogo = new URL('./logos/arxiv.svg', import.meta.url).href
const semanticScholarLogo = new URL('./logos/semantic_scholar.svg', import.meta.url).href

// Logo components
const SemanticScholarLogo = ({ className = 'h-4 w-4', alt = 'Semantic Scholar' }: { className?: string, alt?: string }) => (
  <img src={semanticScholarLogo} alt={alt} className={className} />
)

const CrossRefLogo = ({ className = 'h-4 w-4', alt = 'CrossRef' }: { className?: string, alt?: string }) => (
  <img src={crossrefLogo} alt={alt} className={className} />
)

const ArxivLogo = ({ className = 'h-4 w-4', alt = 'arXiv' }: { className?: string, alt?: string }) => (
  <img src={arxivLogo} alt={alt} className={className} />
)

// Import our extracted hooks
import { useSearchExecution } from "../../hooks/useSearchExecution"
import { useReferenceManagement } from "../../hooks/useReferenceManagement"
import { useQueryRefinement } from "../../hooks/useQueryRefinement"
import { useDuplicateDetection } from "../../hooks/useDuplicateDetection"
import { useFeedbackManagement } from "../../hooks/useFeedbackManagement"

// Import existing components that we're not refactoring
import { ContentSourceSelector } from "./content-source-selector"
import { SearchFiltersPanel } from "./search-filters-panel"

interface AISearcherProps {
  conversationId: string
  onAddReference?: (reference: Partial<Reference>) => void
}

interface SearchResult {
  title: string
  authors: string[]
  journal?: string
  publication_date?: string
  doi?: string
  url?: string
  confidence: number
  relevance_score: number
  citations?: number
  keywords?: string[]
  sessionId?: string
}

/**
 * A comprehensive AI-powered academic reference search interface.
 * It allows users to search for references, refine queries, handle duplicates, and track search analytics.
 * @param {AISearcherProps} props - The properties for the AISearcher component.
 * @param {string} props.conversationId - The ID of the current conversation, used for context and analytics.
 * @param {(reference: Partial<Reference>) => void} [props.onAddReference] - Optional callback function to add a selected reference to the user's collection.
 * @example
 * ```tsx
 * <AISearcher conversationId="conv-123" onAddReference={(ref) => console.log('Adding reference', ref)} />
 * ```
 */
export const AISearcher: React.FC<AISearcherProps> = ({
  conversationId,
  onAddReference
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ sortBy: 'relevance' })
  const [showFilters, setShowFilters] = useState(false)
  const [showContentSelector, setShowContentSelector] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ExtractedContent[]>([])
  const [contentPreview, setContentPreview] = useState<ExtractedContent | null>(null)
  
  // Privacy management
  const privacyManager = usePrivacyManager(conversationId)
  const [showPrivacyControls, setShowPrivacyControls] = useState(false)
  
  // Analytics tracking
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const searchTracking = useSearchResultTracking(currentSessionId || '')
  
  // Duplicate detection engine
  const [deduplicationOptions, setDeduplicationOptions] = useState<DuplicateDetectionOptions>({
    titleSimilarityThreshold: 0.85,
    authorSimilarityThreshold: 0.8,
    enableFuzzyMatching: true,
    strictDOIMatching: true,
    mergeStrategy: 'keep_highest_quality'
  })
  const [duplicateDetectionEngine] = useState(() => new DuplicateDetectionEngine(deduplicationOptions))
  
  // Use our extracted hooks
  const searchExecution = useSearchExecution(duplicateDetectionEngine, deduplicationOptions)
  const referenceManagement = useReferenceManagement()
  const queryRefinement = useQueryRefinement()
  const duplicateDetection = useDuplicateDetection()
  const feedbackManagement = useFeedbackManagement()
  
  // Handler functions
  const handleSearch = async () => {
    await searchExecution.handleSearch(
      searchQuery, 
      conversationId, 
      searchFilters, 
      privacyManager
    )
  }
  
  const handleAddReference = async (result: SearchResult) => {
    await referenceManagement.handleAddReference(
      result,
      conversationId,
      onAddReference,
      searchExecution.currentSessionId,
      searchTracking
    )
  }
  
  const handleRefineQuery = async () => {
    await queryRefinement.handleRefineQuery(
      searchQuery,
      selectedContent,
      conversationId
    )
  }
  
  const handleApplyRefinement = (refinedQuery: RefinedQuery) => {
    queryRefinement.handleApplyRefinement(refinedQuery, setSearchQuery)
  }
  
  const handleRegenerateRefinement = () => {
    queryRefinement.handleRegenerateRefinement(handleRefineQuery)
  }
  
  const handleDeduplicationOptionsChange = (options: DuplicateDetectionOptions) => {
    duplicateDetection.handleDeduplicationOptionsChange(
      options,
      searchExecution.originalResults,
      searchExecution.setSearchResults
    )
  }
  
  const handleResolveDuplicateConflicts = (resolvedResults: ScholarSearchResult[]) => {
    duplicateDetection.handleResolveDuplicateConflicts(
      resolvedResults,
      searchExecution.setSearchResults
    )
  }
  
  const handleResultFeedback = async (resultId: string, feedback: SearchResultFeedback) => {
    await feedbackManagement.handleResultFeedback(
      resultId,
      feedback,
      searchExecution.currentSessionId
    )
  }
  
  const handleSessionFeedback = async (feedback: SearchSessionFeedback) => {
    await feedbackManagement.handleSessionFeedback(
      feedback,
      searchExecution.currentSessionId,
      conversationId,
      feedbackManagement.setShowSessionFeedback
    )
  }
  
  const handleFiltersChange = (filters: SearchFilters) => {
    setSearchFilters(filters)
  }
  
  const handleResetFilters = () => {
    setSearchFilters({ sortBy: 'relevance' })
  }
  
  const handleToggleFilters = () => {
    setShowFilters(!showFilters)
  }
  
  const handleContentSelected = (content: ExtractedContent[]) => {
    setSelectedContent(content)
    setShowContentSelector(false)
  }
  
  const handleContentPreview = (content: ExtractedContent) => {
    setContentPreview(content)
  }
  
  const handleSearchQueryGenerated = (query: string) => {
    setSearchQuery(query)
  }
  
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }
  
  return (
    <div className="space-y-6">
      <SearchHeader 
        onTogglePrivacyControls={() => setShowPrivacyControls(!showPrivacyControls)}
        showPrivacyControls={showPrivacyControls}
      />
      
      <PrivacyManagement
        conversationId={conversationId}
        showPrivacyControls={showPrivacyControls}
      />
      
      <ContentSourceManagement
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onToggleContentSelector={() => setShowContentSelector(!showContentSelector)}
        showContentSelector={showContentSelector}
        selectedContent={selectedContent}
        onSearch={handleSearch}
        loading={searchExecution.loading}
        onToggleFilters={handleToggleFilters}
        onRefineQuery={handleRefineQuery}
        refinementLoading={queryRefinement.refinementLoading}
      />
      
      {showContentSelector && (
        <ContentSourceSelector
          conversationId={conversationId}
          onContentSelected={handleContentSelected}
          onContentPreview={handleContentPreview}
          onSearchQueryGenerated={handleSearchQueryGenerated}
          isVisible={showContentSelector}
        />
      )}
      
      <SearchFiltersPanel
        filters={searchFilters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        isVisible={showFilters}
        onToggleVisibility={handleToggleFilters}
      />
      
      <ResultsManagement
        hasSearched={searchExecution.hasSearched}
        searchResults={searchExecution.searchResults}
        originalResults={searchExecution.originalResults}
        searchError={searchExecution.searchError}
        loading={searchExecution.loading}
        currentSessionId={searchExecution.currentSessionId}
        duplicatesDetected={duplicateDetection.duplicatesDetected}
        duplicateGroups={duplicateDetection.duplicateGroups}
        deduplicationOptions={deduplicationOptions}
        showDuplicateResolver={duplicateDetection.showDuplicateResolver}
        showDeduplicationSettings={duplicateDetection.showDeduplicationSettings}
        sessionFeedbackSubmitted={feedbackManagement.sessionFeedbackSubmitted}
        showSessionFeedback={feedbackManagement.showSessionFeedback}
        searchQuery={searchQuery}
        selectedContent={selectedContent}
        onAddReference={handleAddReference}
        onProvideFeedback={handleResultFeedback}
        onResolveDuplicateConflicts={handleResolveDuplicateConflicts}
        onCancelDuplicateResolution={duplicateDetection.handleCancelDuplicateResolution}
        onShowSessionFeedback={feedbackManagement.handleShowSessionFeedback}
        onCancelSessionFeedback={feedbackManagement.handleCancelSessionFeedback}
        onToggleDeduplicationSettings={() => duplicateDetection.setShowDeduplicationSettings(!duplicateDetection.showDeduplicationSettings)}
        onShowDuplicateResolver={duplicateDetection.handleShowDuplicateResolver}
        onQueryUpdate={setSearchQuery}
        onApplyRefinement={handleApplyRefinement}
        onRegenerateRefinement={handleRegenerateRefinement}
        refinementLoading={queryRefinement.refinementLoading}
        queryRefinement={queryRefinement.queryRefinement}
        showQueryRefinement={queryRefinement.showQueryRefinement}
        onToggleQueryRefinement={() => queryRefinement.setShowQueryRefinement(false)}
      />

      {/* Powered by indicator */}
      <div className="pt-3 border-t mt-4">
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span className="mr-2">Powered by</span>
          <a href="https://www.semanticscholar.org/" target="_blank" rel="noopener noreferrer" aria-label="Semantic Scholar" className="inline-flex">
            <Badge variant="outline" className="text-[10px] flex items-center gap-2">
              <SemanticScholarLogo />
              <span>Semantic Scholar</span>
            </Badge>
          </a>
          <a href="https://www.crossref.org/" target="_blank" rel="noopener noreferrer" aria-label="CrossRef" className="inline-flex">
            <Badge variant="outline" className="text-[10px] flex items-center gap-2">
              <CrossRefLogo />
              <span>CrossRef</span>
            </Badge>
          </a>
          <a href="https://arxiv.org/" target="_blank" rel="noopener noreferrer" aria-label="arXiv" className="inline-flex">
            <Badge variant="outline" className="text-[10px] flex items-center gap-2">
              <ArxivLogo />
              <span>arXiv</span>
            </Badge>
          </a>
        </div>
      </div>
    </div>
  )
}