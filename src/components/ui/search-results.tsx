"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Button } from './shadcn/button';
import { Badge } from './shadcn/badge';
import { Separator } from './shadcn/separator';
import { ScrollArea } from './shadcn/scroll-area';
import { CitationFormatter } from './citation-formatter';
import { ReferenceSuggestion, SearchAnalytics, Reference, ReferenceType } from '../../lib/ai-types';
import { CheckCircle, XCircle, AlertCircle, BookOpen, Calendar, BarChart3, TrendingUp, RefreshCw, Download } from 'lucide-react';

interface SearchResultsProps {
  suggestions: ReferenceSuggestion[];
  analytics: SearchAnalytics;
  onSuggestionSelect?: (suggestion: ReferenceSuggestion) => void;
  onNewSearch?: () => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  suggestions,
  analytics,
  onSuggestionSelect,
  onNewSearch
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ReferenceSuggestion | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set());

  const handleSuggestionSelect = (suggestion: ReferenceSuggestion) => {
    setSelectedSuggestion(suggestion);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleAcceptSuggestion = async (suggestion: ReferenceSuggestion) => {
    try {
      // TODO: Call API to mark suggestion as accepted
      setAcceptedSuggestions(prev => new Set([...prev, suggestion.id]));

      // Call the selection handler
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      }
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  const handleRejectSuggestion = async (suggestion: ReferenceSuggestion) => {
    try {
      // TODO: Call API to mark suggestion as rejected
      setRejectedSuggestions(prev => new Set([...prev, suggestion.id]));
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  const exportResults = () => {
    const csvContent = [
      ['Title', 'Authors', 'Journal', 'Year', 'Relevance Score', 'Confidence', 'DOI'].join(','),
      ...suggestions.map(s => [
        `"${s.reference.title?.replace(/"/g, '""') || ''}"`,
        `"${s.reference.authors?.map(a => `${a.lastName}, ${a.firstName}`).join('; ') || ''}"`,
        `"${s.reference.journal || ''}"`,
        s.reference.publicationDate?.getFullYear() || '',
        s.relevanceScore.toFixed(3),
        s.confidence.toFixed(3),
        s.reference.doi || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-search-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderAnalytics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Results</p>
              <p className="text-2xl font-bold">{suggestions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold">{(analytics.successRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Results</p>
              <p className="text-2xl font-bold">{analytics.averageResults.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Top Sources</p>
              <p className="text-lg font-bold">{analytics.topSources.join(', ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuggestionItem = (suggestion: ReferenceSuggestion) => {
    const isAccepted = acceptedSuggestions.has(suggestion.id);
    const isRejected = rejectedSuggestions.has(suggestion.id);
    const isSelected = selectedSuggestion?.id === suggestion.id;

    return (
      <Card
        key={suggestion.id}
        className={`transition-all cursor-pointer hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        } ${isAccepted ? 'bg-green-50 border-green-200' : ''} ${
          isRejected ? 'bg-red-50 border-red-200' : ''
        }`}
        onClick={() => handleSuggestionSelect(suggestion)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">
                {suggestion.reference.title}
              </CardTitle>
              <CardDescription className="mt-1">
                {suggestion.reference.authors?.map(author =>
                  `${author.firstName} ${author.lastName}`
                ).join(', ')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="secondary" className="text-xs">
                {(suggestion.relevanceScore * 100).toFixed(0)}% relevant
              </Badge>
              {suggestion.isDuplicate && (
                <Badge variant="destructive" className="text-xs">
                  Duplicate
                </Badge>
              )}
              {isAccepted && (
                <Badge variant="default" className="text-xs bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accepted
                </Badge>
              )}
              {isRejected && (
                <Badge variant="destructive" className="text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {suggestion.reference.journal && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span>{suggestion.reference.journal}</span>
              </div>
            )}
            {suggestion.reference.publicationDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{suggestion.reference.publicationDate.getFullYear()}</span>
              </div>
            )}
            {suggestion.reference.doi && (
              <div className="flex items-center gap-1">
                <span className="text-xs">DOI: {suggestion.reference.doi}</span>
              </div>
            )}
          </div>

          {/* Abstract/Description */}
          {suggestion.reference.abstract && (
            <div className="text-sm text-muted-foreground line-clamp-3">
              {suggestion.reference.abstract}
            </div>
          )}

          {/* Reasoning */}
          {suggestion.reasoning && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Why this suggestion?</p>
                  <p>{suggestion.reasoning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Confidence: {(suggestion.confidence * 100).toFixed(1)}%</span>
              <Separator orientation="vertical" className="h-3" />
              <span>Search: {suggestion.searchQuery}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isAccepted && !isRejected && (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptSuggestion(suggestion);
                    }}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectSuggestion(suggestion);
                    }}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or selecting different content sources.
            </p>
            {onNewSearch && (
              <Button onClick={onNewSearch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start New Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Search Results</h2>
          <p className="text-muted-foreground">
            Found {suggestions.length} relevant academic papers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {onNewSearch && (
            <Button onClick={onNewSearch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              New Search
            </Button>
          )}
        </div>
      </div>

      {/* Analytics */}
      {renderAnalytics()}

      {/* Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Search Results</h3>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 pr-4">
            {suggestions.map(renderSuggestionItem)}
          </div>
        </ScrollArea>
      </div>

      {/* Citation Formatter for Selected Item */}
      {selectedSuggestion && (
        <div className="space-y-4">
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Citation Formatting</h3>
            <CitationFormatter
              reference={convertMetadataToReference(selectedSuggestion.reference)}
              conversationId="current-conversation"
              onStyleChange={(style) => {
                // Handle style change if needed
                console.log('Citation style changed to:', style);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to convert ReferenceMetadata to Reference
function convertMetadataToReference(metadata: any): Reference {
  return {
    id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    conversationId: 'current-conversation',
    type: metadata.type || ReferenceType.JOURNAL_ARTICLE,
    title: metadata.title || '',
    authors: metadata.authors || [],
    publicationDate: metadata.publicationDate,
    url: metadata.url,
    doi: metadata.doi,
    journal: metadata.journal,
    volume: metadata.volume,
    issue: metadata.issue,
    pages: metadata.pages,
    publisher: metadata.publisher,
    isbn: metadata.isbn,
    edition: metadata.edition,
    chapter: metadata.chapter,
    editor: metadata.editor,
    accessDate: metadata.accessDate,
    notes: metadata.notes,
    tags: metadata.tags || [],
    metadataConfidence: metadata.confidence || 0.8,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
