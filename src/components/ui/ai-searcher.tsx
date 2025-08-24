"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Label } from "./shadcn/label"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Reference, ReferenceType, ExtractedContent } from "../../lib/ai-types"
import { Search, Sparkles, ExternalLink, Plus, Settings, Zap, Merge, AlertTriangle, MessageSquare, Filter, Shield } from "lucide-react"
import { ContentSourceSelector } from "./content-source-selector"
import { QueryRefinementPanel } from "./query-refinement-panel"
import { DuplicateConflictResolver } from "./duplicate-conflict-resolver"
import { DeduplicationSettings } from "./deduplication-settings"
import { SearchResultsDisplay } from "./search-results-display"
import { SearchSessionFeedbackComponent, SearchSessionFeedback } from "./search-session-feedback"
import { SearchResultFeedback } from "./search-result-feedback"
import { SearchFiltersPanel } from "./search-filters-panel"
import { QueryRefinement, RefinedQuery } from "../../worker/lib/query-generation-engine"
import { DuplicateDetectionEngine, DuplicateDetectionOptions, DuplicateGroup } from "../../worker/lib/duplicate-detection-engine"
import { ScholarSearchResult, SearchFilters } from "../../lib/ai-types"
import { useSearchResultTracking } from "../../hooks/useSearchAnalytics"
import { usePrivacyManager } from "../../hooks/usePrivacyManager"
import { ConsentBanner } from "./consent-banner"
import { PrivacyControls } from "./privacy-controls"

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

export const AISearcher: React.FC<AISearcherProps> = ({
  conversationId,
  onAddReference
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addingReference, setAddingReference] = useState<string | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  // Privacy management
  const privacyManager = usePrivacyManager(conversationId)
  const [showPrivacyControls, setShowPrivacyControls] = useState(false)
  
  // Analytics tracking
  const searchTracking = useSearchResultTracking(currentSessionId || '')
  
  // Content source selection state
  const [showContentSelector, setShowContentSelector] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ExtractedContent[]>([])
  const [contentPreview, setContentPreview] = useState<ExtractedContent | null>(null)
  
  // Query refinement state
  const [showQueryRefinement, setShowQueryRefinement] = useState(false)
  const [queryRefinement, setQueryRefinement] = useState<QueryRefinement | null>(null)
  const [refinementLoading, setRefinementLoading] = useState(false)
  
  // Duplicate detection state
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [showDuplicateResolver, setShowDuplicateResolver] = useState(false)
  const [showDeduplicationSettings, setShowDeduplicationSettings] = useState(false)
  const [deduplicationOptions, setDeduplicationOptions] = useState<DuplicateDetectionOptions>({
    titleSimilarityThreshold: 0.85,
    authorSimilarityThreshold: 0.8,
    enableFuzzyMatching: true,
    strictDOIMatching: true,
    mergeStrategy: 'keep_highest_quality'
  })
  const [duplicateDetectionEngine] = useState(() => new DuplicateDetectionEngine(deduplicationOptions))
  const [originalResults, setOriginalResults] = useState<SearchResult[]>([])
  const [duplicatesDetected, setDuplicatesDetected] = useState(false)
  
  // Feedback state
  const [showSessionFeedback, setShowSessionFeedback] = useState(false)
  const [sessionFeedbackSubmitted, setSessionFeedbackSubmitted] = useState(false)
  
  // Search filters state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    sortBy: 'relevance'
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    // Check if user has given consent for AI features
    if (!privacyManager.hasConsent) {
      setSearchError('Please provide consent for AI features to use the search functionality.')
      return
    }

    setLoading(true)
    setSearchError(null)
    setSearchResults([])
    
    try {
      const response = await fetch('/api/ai-searcher/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          conversationId: conversationId,
          filters: searchFilters
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        const results = data.results || []
        setOriginalResults(results)
        
        // Capture sessionId for analytics tracking
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId)
        }
        
        // Convert to ScholarSearchResult format for duplicate detection
        const scholarResults: ScholarSearchResult[] = results.map((result: SearchResult) => ({
          ...result,
          authors: result.authors || [],
          year: result.publication_date ? parseInt(result.publication_date) : undefined,
          citation_count: result.citations,
          keywords: result.keywords || []
        }))
        
        // Detect duplicates
        const detectedGroups = duplicateDetectionEngine.detectDuplicates(scholarResults)
        setDuplicateGroups(detectedGroups)
        setDuplicatesDetected(detectedGroups.length > 0)
        
        // Apply automatic deduplication if no manual review required
        if (deduplicationOptions.mergeStrategy !== 'manual_review' && detectedGroups.length > 0) {
          const deduplicatedResults = duplicateDetectionEngine.removeDuplicates(scholarResults)
          const convertedResults = deduplicatedResults.map(result => ({
            title: result.title,
            authors: result.authors,
            journal: result.journal,
            publication_date: result.year?.toString(),
            doi: result.doi,
            url: result.url,
            confidence: result.confidence,
            relevance_score: result.relevance_score,
            citations: result.citations
          }))
          setSearchResults(convertedResults)
        } else {
          setSearchResults(results)
        }
        
        setHasSearched(true)
        setSearchError(null)
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Error performing AI search:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.')
      
      // Fallback to mock results if API fails (for development/testing)
      const mockResults: SearchResult[] = [
        {
          title: "Machine Learning Approaches to Natural Language Processing",
          authors: ["Smith, J.", "Johnson, A.", "Williams, B."],
          journal: "Journal of Artificial Intelligence Research",
          publication_date: "2023",
          doi: "10.1234/jair.2023.12345",
          url: "https://doi.org/10.1234/jair.2023.12345",
          confidence: 0.92,
          relevance_score: 0.88
        },
        {
          title: "Deep Learning for Academic Writing Enhancement",
          authors: ["Brown, C.", "Davis, E."],
          journal: "International Journal of Computational Linguistics",
          publication_date: "2022",
          doi: "10.5678/ijcl.2022.67890",
          url: "https://doi.org/10.5678/ijcl.2022.67890",
          confidence: 0.87,
          relevance_score: 0.76
        },
        {
          title: "AI-Powered Reference Management Systems",
          authors: ["Wilson, M.", "Taylor, R.", "Anderson, S."],
          journal: "ACM Transactions on Information Systems",
          publication_date: "2024",
          doi: "10.9012/acm.2024.90123",
          url: "https://doi.org/10.9012/acm.2024.90123",
          confidence: 0.95,
          relevance_score: 0.91
        }
      ]
      setOriginalResults(mockResults)
      
      // Convert to ScholarSearchResult format for duplicate detection
      const scholarResults: ScholarSearchResult[] = mockResults.map(result => ({
        ...result,
        authors: result.authors || [],
        year: result.publication_date ? parseInt(result.publication_date) : undefined,
        citation_count: result.citations,
        keywords: result.keywords || []
      }))
      
      // Detect duplicates
      const detectedGroups = duplicateDetectionEngine.detectDuplicates(scholarResults)
      setDuplicateGroups(detectedGroups)
      setDuplicatesDetected(detectedGroups.length > 0)
      
      // Apply automatic deduplication if no manual review required
      if (deduplicationOptions.mergeStrategy !== 'manual_review' && detectedGroups.length > 0) {
        const deduplicatedResults = duplicateDetectionEngine.removeDuplicates(scholarResults)
        const convertedResults = deduplicatedResults.map(result => ({
          title: result.title,
          authors: result.authors,
          journal: result.journal,
          publication_date: result.year?.toString(),
          doi: result.doi,
          url: result.url,
          confidence: result.confidence,
          relevance_score: result.relevance_score,
          citations: result.citations
        }))
        setSearchResults(convertedResults)
      } else {
        setSearchResults(mockResults)
      }
      
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReference = async (result: SearchResult) => {
    if (!onAddReference) return

    const resultId = `${result.title}-${result.authors[0]}`
    setAddingReference(resultId)

    try {
      // Convert SearchResult to ScholarSearchResult format for the API
      const searchResult: ScholarSearchResult = {
        title: result.title,
        authors: result.authors,
        journal: result.journal,
        year: result.publication_date ? parseInt(result.publication_date) : undefined,
        doi: result.doi,
        url: result.url,
        confidence: result.confidence,
        relevance_score: result.relevance_score,
        citation_count: result.citations,
        keywords: [],

      }

      // Call the new AI search reference addition API
      const response = await fetch('/api/referencer/add-from-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchResult,
          conversationId,
          options: {
            checkDuplicates: true,
            duplicateHandling: 'prompt_user',
            minConfidence: 0.5,
            autoPopulateMetadata: true
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        // Successfully added reference
        if (onAddReference) {
          await onAddReference(data.reference)
        }
        
        // Track reference addition for analytics
        if (currentSessionId) {
          try {
            await searchTracking.trackReferenceAdded(
              result.title,
              data.reference.id,
              resultId
            )
          } catch (trackingError) {
            console.warn('Failed to track reference addition:', trackingError)
          }
        }
      } else if (data.isDuplicate && data.mergeOptions) {
        // Handle duplicate reference - for now, show error
        // In a full implementation, this would show a merge dialog
        console.warn('Duplicate reference detected:', data.duplicateReference)
        throw new Error(`Reference already exists: "${data.duplicateReference?.title}"`)
      } else {
        throw new Error(data.error || 'Failed to add reference')
      }
    } catch (error) {
      console.error('Error adding reference:', error)
      
      // Track reference rejection for analytics
      if (currentSessionId) {
        try {
          await searchTracking.trackReferenceRejected(
            result.title,
            resultId,
            { comments: error instanceof Error ? error.message : 'Unknown error' }
          )
        } catch (trackingError) {
          console.warn('Failed to track reference rejection:', trackingError)
        }
      }
      
      // Error handling is done in the parent component
      throw error
    } finally {
      setAddingReference(null)
    }
  }

  const handleResultView = async (result: SearchResult) => {
    // Track when user views a search result
    if (currentSessionId) {
      try {
        await searchTracking.trackReferenceViewed(result.title)
      } catch (trackingError) {
        console.warn('Failed to track result view:', trackingError)
      }
    }
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

  const handleRefineQuery = async () => {
    if (!searchQuery.trim()) return

    setRefinementLoading(true)
    setShowQueryRefinement(true)
    
    try {
      const response = await fetch('/api/ai-searcher/refine-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          originalContent: selectedContent,
          conversationId: conversationId
        })
      })

      if (!response.ok) {
        throw new Error(`Query refinement failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setQueryRefinement(data.refinement)
      } else {
        throw new Error(data.error || 'Query refinement failed')
      }
    } catch (error) {
      console.error('Error refining query:', error)
      // For development, create a mock refinement
      const mockRefinement: QueryRefinement = {
        breadthAnalysis: {
          breadthScore: 0.6,
          classification: 'optimal',
          reasoning: 'Query has good balance between specificity and breadth',
          termCount: 3,
          specificityLevel: 'moderate',
          suggestions: []
        },
        alternativeTerms: {
          synonyms: [
            { term: 'research', confidence: 0.9, reasoning: 'Common academic synonym', category: 'synonym' },
            { term: 'study', confidence: 0.8, reasoning: 'Alternative academic term', category: 'synonym' }
          ],
          relatedTerms: [
            { term: 'methodology', confidence: 0.7, reasoning: 'Related research concept', category: 'related' }
          ],
          broaderTerms: [
            { term: 'science', confidence: 0.6, reasoning: 'Broader field', category: 'broader' }
          ],
          narrowerTerms: [
            { term: 'experimental design', confidence: 0.8, reasoning: 'More specific approach', category: 'narrower' }
          ],
          academicVariants: [
            { term: 'empirical investigation', confidence: 0.9, reasoning: 'Academic terminology', category: 'academic' }
          ]
        },
        validationResults: {
          isValid: true,
          issues: [],
          suggestions: ['Consider adding academic terms for better scholarly relevance'],
          confidence: 0.85
        },
        optimizationRecommendations: [
          {
            type: 'add_term',
            description: 'Add academic context terms',
            impact: 'medium',
            priority: 1,
            beforeQuery: searchQuery,
            afterQuery: `(${searchQuery}) AND (research OR study)`,
            reasoning: 'Academic terms improve scholarly relevance'
          }
        ],
        refinedQueries: [
          {
            query: `(${searchQuery}) AND (research OR study OR analysis)`,
            refinementType: 'academic_enhanced',
            confidence: 0.9,
            expectedResults: 'similar',
            description: 'Enhanced with academic terminology',
            changes: [
              {
                type: 'added',
                element: 'academic terms',
                reasoning: 'Added academic context for better scholarly results'
              }
            ]
          }
        ]
      }
      setQueryRefinement(mockRefinement)
    } finally {
      setRefinementLoading(false)
    }
  }

  const handleQueryUpdate = (newQuery: string) => {
    setSearchQuery(newQuery)
  }

  const handleApplyRefinement = (refinedQuery: RefinedQuery) => {
    setSearchQuery(refinedQuery.query)
    setShowQueryRefinement(false)
  }

  const handleRegenerateRefinement = () => {
    handleRefineQuery()
  }

  const handleDeduplicationOptionsChange = (options: DuplicateDetectionOptions) => {
    setDeduplicationOptions(options)
    // Create new engine instance with updated options
    const newEngine = new DuplicateDetectionEngine(options)
    
    // Re-run duplicate detection with new options if we have results
    if (originalResults.length > 0) {
      const scholarResults: ScholarSearchResult[] = originalResults.map(result => ({
        ...result,
        authors: result.authors || [],
        year: result.publication_date ? parseInt(result.publication_date) : undefined,
        citation_count: result.citations,
        keywords: result.keywords || []
      }))
      
      const detectedGroups = newEngine.detectDuplicates(scholarResults)
      setDuplicateGroups(detectedGroups)
      setDuplicatesDetected(detectedGroups.length > 0)
      
      // Apply automatic deduplication if no manual review required
      if (options.mergeStrategy !== 'manual_review' && detectedGroups.length > 0) {
        const deduplicatedResults = newEngine.removeDuplicates(scholarResults)
        const convertedResults = deduplicatedResults.map(result => ({
          title: result.title,
          authors: result.authors,
          journal: result.journal,
          publication_date: result.year?.toString(),
          doi: result.doi,
          url: result.url,
          confidence: result.confidence,
          relevance_score: result.relevance_score,
          citations: result.citations
        }))
        setSearchResults(convertedResults)
      } else {
        setSearchResults(originalResults)
      }
    }
  }

  const handleResolveDuplicateConflicts = (resolvedResults: ScholarSearchResult[]) => {
    const convertedResults = resolvedResults.map(result => ({
      title: result.title,
      authors: result.authors,
      journal: result.journal,
      publication_date: result.year?.toString(),
      doi: result.doi,
      url: result.url,
      confidence: result.confidence,
      relevance_score: result.relevance_score,
      citations: result.citations
    }))
    
    setSearchResults(convertedResults)
    setShowDuplicateResolver(false)
    setDuplicatesDetected(false)
  }

  const handleShowDuplicateResolver = () => {
    setShowDuplicateResolver(true)
  }

  const handleCancelDuplicateResolution = () => {
    setShowDuplicateResolver(false)
  }

  const handleResultFeedback = async (resultId: string, feedback: SearchResultFeedback) => {
    if (!currentSessionId) {
      throw new Error('No active search session')
    }

    try {
      const response = await fetch('/api/ai-searcher/feedback/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchSessionId: currentSessionId,
          resultId,
          feedback: {
            isRelevant: feedback.isRelevant,
            qualityRating: feedback.qualityRating,
            comments: feedback.comments,
            timestamp: feedback.timestamp.toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to submit feedback: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit feedback')
      }

      console.log('Result feedback submitted successfully')
    } catch (error) {
      console.error('Error submitting result feedback:', error)
      throw error
    }
  }

  const handleSessionFeedback = async (feedback: SearchSessionFeedback) => {
    if (!currentSessionId) {
      throw new Error('No active search session')
    }

    try {
      const response = await fetch('/api/ai-searcher/feedback/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchSessionId: currentSessionId,
          conversationId,
          feedback: {
            overallSatisfaction: feedback.overallSatisfaction,
            relevanceRating: feedback.relevanceRating,
            qualityRating: feedback.qualityRating,
            easeOfUseRating: feedback.easeOfUseRating,
            feedbackComments: feedback.feedbackComments,
            wouldRecommend: feedback.wouldRecommend,
            improvementSuggestions: feedback.improvementSuggestions,
            timestamp: feedback.timestamp.toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to submit session feedback: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit session feedback')
      }

      setSessionFeedbackSubmitted(true)
      setShowSessionFeedback(false)
      console.log('Session feedback submitted successfully')
    } catch (error) {
      console.error('Error submitting session feedback:', error)
      throw error
    }
  }

  const handleShowSessionFeedback = () => {
    setShowSessionFeedback(true)
  }

  const handleCancelSessionFeedback = () => {
    setShowSessionFeedback(false)
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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI-Powered Reference Search</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPrivacyControls(!showPrivacyControls)}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          Privacy
        </Button>
      </div>

      {/* Consent Banner */}
      <ConsentBanner 
        conversationId={conversationId}
        onConsentChange={(granted) => {
          if (granted) {
            privacyManager.loadSettings()
          }
        }}
      />

      {/* Privacy Controls */}
      {showPrivacyControls && (
        <PrivacyControls
          conversationId={conversationId}
          onSettingsChange={(settings) => {
            privacyManager.loadSettings()
          }}
          onDataCleared={() => {
            privacyManager.loadDataSummary()
          }}
          onDataExported={(data) => {
            console.log('Data exported:', data)
          }}
        />
      )}

      {/* Content Source Selection Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            AI-Powered Search Options
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContentSelector(!showContentSelector)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {showContentSelector ? 'Hide' : 'Show'} Content Selection
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Content Summary */}
            {selectedContent.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">
                    Using content from {selectedContent.length} source{selectedContent.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  Search query will be generated from your selected Ideas and Builder content
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="search-query">Search Query</Label>
              <div className="flex gap-2">
                <Input
                  id="search-query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={selectedContent.length > 0 
                    ? "Query generated from selected content (you can modify it)" 
                    : "Enter your search query (e.g., 'machine learning in education')"
                  }
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  variant="outline"
                  onClick={handleToggleFilters}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefineQuery}
                  disabled={refinementLoading || !searchQuery.trim()}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {refinementLoading ? 'Analyzing...' : 'Refine'}
                </Button>
                <Button
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Tip:</strong> Use the content selection above to automatically generate search queries from your Ideas and Builder content, 
                or enter a custom query for manual search.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Source Selector */}
      {showContentSelector && (
        <ContentSourceSelector
          conversationId={conversationId}
          onContentSelected={handleContentSelected}
          onContentPreview={handleContentPreview}
          onSearchQueryGenerated={handleSearchQueryGenerated}
          isVisible={showContentSelector}
        />
      )}

      {/* Search Filters Panel */}
      <SearchFiltersPanel
        filters={searchFilters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
        isVisible={showFilters}
        onToggleVisibility={handleToggleFilters}
      />

      {/* Query Refinement Panel */}
      {showQueryRefinement && queryRefinement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Query Refinement & Analysis
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQueryRefinement(false)}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryRefinementPanel
              originalQuery={searchQuery}
              refinement={queryRefinement}
              onQueryUpdate={handleQueryUpdate}
              onApplyRefinement={handleApplyRefinement}
              onRegenerateRefinement={handleRegenerateRefinement}
              isLoading={refinementLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Deduplication Settings */}
      {showDeduplicationSettings && (
        <DeduplicationSettings
          options={deduplicationOptions}
          onOptionsChange={handleDeduplicationOptionsChange}
          onReset={() => {
            const defaultOptions: DuplicateDetectionOptions = {
              titleSimilarityThreshold: 0.85,
              authorSimilarityThreshold: 0.8,
              enableFuzzyMatching: true,
              strictDOIMatching: true,
              mergeStrategy: 'keep_highest_quality'
            }
            handleDeduplicationOptionsChange(defaultOptions)
          }}
        />
      )}

      {/* Duplicate Conflict Resolver */}
      {showDuplicateResolver && duplicateGroups.length > 0 && (
        <DuplicateConflictResolver
          duplicateGroups={duplicateGroups}
          onResolveConflicts={handleResolveDuplicateConflicts}
          onCancel={handleCancelDuplicateResolution}
        />
      )}

      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-base font-semibold">
                Search Results ({searchResults.length})
              </h4>
              {duplicatesDetected && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {duplicateGroups.length} duplicate group{duplicateGroups.length > 1 ? 's' : ''} detected
                </Badge>
              )}
              {sessionFeedbackSubmitted && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Feedback Submitted
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeduplicationSettings(!showDeduplicationSettings)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Deduplication Settings
              </Button>
              {duplicatesDetected && deduplicationOptions.mergeStrategy === 'manual_review' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowDuplicateResolver}
                  className="flex items-center gap-2"
                >
                  <Merge className="h-4 w-4" />
                  Resolve Duplicates
                </Button>
              )}
              {currentSessionId && !sessionFeedbackSubmitted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowSessionFeedback}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Rate Search
                </Button>
              )}
            </div>
          </div>

          {searchError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <span className="font-medium">Search Error:</span>
                <span>{searchError}</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Showing fallback results for demonstration. Please try your search again.
              </p>
            </div>
          )}

          {duplicatesDetected && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 mb-2">
                <Merge className="h-4 w-4" />
                <span className="font-medium">Duplicate Detection Results</span>
              </div>
              <div className="text-sm text-orange-700">
                <p>
                  Found {duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''} of duplicate results 
                  from {originalResults.length} original results.
                  {deduplicationOptions.mergeStrategy === 'manual_review' ? (
                    <> Click "Resolve Duplicates" to manually review and merge conflicts.</>
                  ) : (
                    <> Duplicates have been automatically merged using the "{deduplicationOptions.mergeStrategy.replace('_', ' ')}" strategy.</>
                  )}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span>Original results: {originalResults.length}</span>
                  <span>After deduplication: {searchResults.length}</span>
                  <span>Removed: {originalResults.length - searchResults.length}</span>
                </div>
              </div>
            </div>
          )}

          <SearchResultsDisplay
            results={searchResults.map(result => ({
              title: result.title,
              authors: result.authors,
              journal: result.journal,
              year: result.publication_date ? parseInt(result.publication_date) : undefined,
              citations: result.citations,
              doi: result.doi,
              url: result.url,
              confidence: result.confidence,
              relevance_score: result.relevance_score,
              keywords: []
            }))}
            extractedContent={{
              content: selectedContent.map(c => c.content).join(' ') || searchQuery,
              keywords: selectedContent.flatMap(c => c.keywords || []),
              topics: selectedContent.flatMap(c => c.topics || []),
              confidence: selectedContent.length > 0 ? 
                selectedContent.reduce((sum, c) => sum + c.confidence, 0) / selectedContent.length : 
                0.5
            }}
            onAddReference={handleAddReference}
            onProvideFeedback={handleResultFeedback}
            loading={loading}
            error={searchError}
          />
          
          {/* Session Feedback Form */}
          {showSessionFeedback && currentSessionId && (
            <div className="mt-6">
              <SearchSessionFeedbackComponent
                searchSessionId={currentSessionId}
                searchQuery={searchQuery}
                resultsCount={searchResults.length}
                onSubmitFeedback={handleSessionFeedback}
                onCancel={handleCancelSessionFeedback}
              />
            </div>
          )}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Enter a search query to find relevant academic references using AI.</p>
          <p className="text-sm">The AI will analyze your query and search through academic databases to find the most relevant papers and articles.</p>
        </div>
      )}
    </div>
  )
}
