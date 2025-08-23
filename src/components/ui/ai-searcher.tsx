"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Label } from "./shadcn/label"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Reference, ReferenceType } from "../../lib/ai-types"
import { Search, Sparkles, ExternalLink, Plus } from "lucide-react"

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

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
          conversationId: conversationId
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setSearchResults(data.results || [])
        setHasSearched(true)
        setSearchError(null)
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (error) {
      console.error('Error performing AI search:', error)
      setSearchError(error.message || 'Search failed. Please try again.')
      
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
      setSearchResults(mockResults)
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
      const reference: Partial<Reference> = {
        type: ReferenceType.JOURNAL_ARTICLE,
        title: result.title,
        authors: result.authors,
        journal: result.journal,
        publication_date: result.publication_date,
        doi: result.doi,
        url: result.url,
        metadata_confidence: result.confidence,
        ai_confidence: result.confidence,
        ai_relevance_score: result.relevance_score,
        ai_search_query: searchQuery
      }

      await onAddReference(reference)
    } catch (error) {
      console.error('Error adding reference:', error)
      // Error handling is done in the parent component
    } finally {
      setAddingReference(null)
    }
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.8) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">AI-Powered Reference Search</h3>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search for Academic References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-query">Search Query</Label>
              <div className="flex gap-2">
                <Input
                  id="search-query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your search query (e.g., 'machine learning in education')"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
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
                <strong>Tip:</strong> Be specific with your search terms for better results.
                Include keywords like author names, publication years, or specific topics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold">
              Search Results ({searchResults.length})
            </h4>
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

          {searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium leading-tight mb-2">
                          {result.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getConfidenceColor(result.confidence)}>
                            AI Confidence: {Math.round(result.confidence * 100)}%
                          </Badge>
                          <Badge variant="outline">
                            Relevance: {Math.round(result.relevance_score * 100)}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <strong>Authors:</strong> {result.authors.join(', ')}
                        </div>
                        {result.journal && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Journal:</strong> {result.journal}
                          </div>
                        )}
                        {result.publication_date && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Published:</strong> {result.publication_date}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {result.doi && (
                          <a
                            href={`https://doi.org/${result.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="View on DOI"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddReference(result)}
                          disabled={addingReference === `${result.title}-${result.authors[0]}`}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {addingReference === `${result.title}-${result.authors[0]}` ? 'Adding...' : 'Add to References'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-muted-foreground">
                      This reference was found using AI-powered search and has been analyzed for relevance to your query.
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{searchQuery}"</p>
              <p className="text-sm">Try adjusting your search terms or try a different query.</p>
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
