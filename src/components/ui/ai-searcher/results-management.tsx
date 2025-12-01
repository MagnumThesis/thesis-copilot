import React from "react";
import { Button } from "../shadcn/button";
import { Badge } from "../shadcn/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn/card";
import { AlertTriangle, Merge, Settings, MessageSquare, Sparkles } from "lucide-react";
import { SearchResultsDisplay } from "../search-results-display";
import { SearchSessionFeedbackComponent } from "../search-session-feedback";
import { DuplicateConflictResolver } from "../duplicate-conflict-resolver";
import { DeduplicationSettings } from "../deduplication-settings";
import { QueryRefinementPanel } from "../query-refinement-panel";

/**
 * Props for the ResultsManagement component
 */
export interface ResultsManagementProps {
  /**
   * Whether a search has been performed
   */
  hasSearched: boolean;
  /**
   * The search results to display
   */
  searchResults: any[];
  /**
   * The original search results before deduplication
   */
  originalResults: any[];
  /**
   * Any search error that occurred
   */
  searchError: string | null;
  /**
   * Whether search is currently loading
   */
  loading: boolean;
  /**
   * The current session ID
   */
  currentSessionId: string | null;
  /**
   * Whether duplicates were detected
   */
  duplicatesDetected: boolean;
  /**
   * The duplicate groups
   */
  duplicateGroups: any[];
  /**
   * The deduplication options
   */
  deduplicationOptions: any;
  /**
   * Whether to show the duplicate resolver
   */
  showDuplicateResolver: boolean;
  /**
   * Whether to show deduplication settings
   */
  showDeduplicationSettings: boolean;
  /**
   * Whether session feedback has been submitted
   */
  sessionFeedbackSubmitted: boolean;
  /**
   * Whether to show the session feedback form
   */
  showSessionFeedback: boolean;
  /**
   * The search query
   */
  searchQuery: string;
  /**
   * The selected content
   */
  selectedContent: any[];
  /**
   * Function to handle adding a reference
   */
  onAddReference: (result: any) => void;
  /**
   * Function to handle providing feedback
   */
  onProvideFeedback: (resultId: string, feedback: any) => void;
  /**
   * Function to handle resolving duplicate conflicts
   */
  onResolveDuplicateConflicts: (resolvedResults: any[]) => void;
  /**
   * Function to handle canceling duplicate resolution
   */
  onCancelDuplicateResolution: () => void;
  /**
   * Function to handle showing the session feedback form
   */
  onShowSessionFeedback: () => void;
  /**
   * Function to handle canceling the session feedback form
   */
  onCancelSessionFeedback: () => void;
  /**
   * Function to handle toggling deduplication settings
   */
  onToggleDeduplicationSettings: () => void;
  /**
   * Function to handle showing the duplicate resolver
   */
  onShowDuplicateResolver: () => void;
  /**
   * Function to handle query updates
   */
  onQueryUpdate: (newQuery: string) => void;
  /**
   * Function to handle applying query refinement
   */
  onApplyRefinement: (refinedQuery: any) => void;
  /**
   * Function to handle regenerating query refinement
   */
  onRegenerateRefinement: () => void;
  /**
   * Whether query refinement is loading
   */
  refinementLoading: boolean;
  /**
   * The query refinement
   */
  queryRefinement: any;
  /**
   * Whether to show query refinement
   */
  showQueryRefinement: boolean;
  /**
   * Function to handle toggling query refinement visibility
   */
  onToggleQueryRefinement: () => void;
}

/**
 * ResultsManagement component handles the search results display, duplicate detection results,
 * and session feedback form.
 */
export const ResultsManagement: React.FC<ResultsManagementProps> = ({
  hasSearched,
  searchResults,
  originalResults,
  searchError,
  loading,
  currentSessionId,
  duplicatesDetected,
  duplicateGroups,
  deduplicationOptions,
  showDuplicateResolver,
  showDeduplicationSettings,
  sessionFeedbackSubmitted,
  showSessionFeedback,
  searchQuery,
  selectedContent,
  onAddReference,
  onProvideFeedback,
  onResolveDuplicateConflicts,
  onCancelDuplicateResolution,
  onShowSessionFeedback,
  onCancelSessionFeedback,
  onToggleDeduplicationSettings,
  onShowDuplicateResolver,
  onQueryUpdate,
  onApplyRefinement,
  onRegenerateRefinement,
  refinementLoading,
  queryRefinement,
  showQueryRefinement,
  onToggleQueryRefinement
}) => {
  return (
    <>
      {/* Query Refinement Panel */}
      {showQueryRefinement && queryRefinement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Merge className="h-5 w-5 text-purple-600" />
                Query Refinement & Analysis
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleQueryRefinement}
              >
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QueryRefinementPanel
              originalQuery={searchQuery}
              refinement={queryRefinement}
              onQueryUpdate={onQueryUpdate}
              onApplyRefinement={onApplyRefinement}
              onRegenerateRefinement={onRegenerateRefinement}
              isLoading={refinementLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Deduplication Settings */}
      {showDeduplicationSettings && (
        <DeduplicationSettings
          options={deduplicationOptions}
          onOptionsChange={() => {}} // This will be handled in the parent component
          onReset={() => {}} // This will be handled in the parent component
        />
      )}

      {/* Duplicate Conflict Resolver */}
      {showDuplicateResolver && duplicateGroups.length > 0 && (
        <DuplicateConflictResolver
          duplicateGroups={duplicateGroups}
          onResolveConflicts={onResolveDuplicateConflicts}
          onCancel={onCancelDuplicateResolution}
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
                onClick={onToggleDeduplicationSettings}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Deduplication Settings
              </Button>
              {duplicatesDetected && deduplicationOptions.mergeStrategy === 'manual_review' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowDuplicateResolver}
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
                  onClick={onShowSessionFeedback}
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
            totalResults={searchResults.length}
            extractedContent={{
              content: selectedContent.map(c => c.content).join(' ') || searchQuery,
              keywords: selectedContent.flatMap(c => c.keywords || []),
              topics: selectedContent.flatMap(c => c.topics || []),
              confidence: selectedContent.length > 0 ? 
                selectedContent.reduce((sum, c) => sum + c.confidence, 0) / selectedContent.length : 
                0.5
            }}
            onAddReference={onAddReference}
            onProvideFeedback={async (resultId, feedback) => onProvideFeedback?.(resultId, feedback)}
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
                onSubmitFeedback={async () => {}} // This will be handled in the parent component
                onCancel={onCancelSessionFeedback}
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
    </>
  );
};