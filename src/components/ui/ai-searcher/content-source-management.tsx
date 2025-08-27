import React from "react";
import { Button } from "../shadcn/button";
import { Input } from "../shadcn/input";
import { Label } from "../shadcn/label";
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn/card";
import { Settings, Sparkles, Filter, Zap, Search } from "lucide-react";
import { ExtractedContent } from "../../../lib/ai-types";

/**
 * Props for the ContentSourceManagement component
 */
export interface ContentSourceManagementProps {
  /**
   * The current search query
   */
  searchQuery: string;
  /**
   * Function to update the search query
   */
  onSearchQueryChange: (query: string) => void;
  /**
   * Function to toggle content selector visibility
   */
  onToggleContentSelector: () => void;
  /**
   * Whether content selector is currently visible
   */
  showContentSelector: boolean;
  /**
   * Array of selected content
   */
  selectedContent: ExtractedContent[];
  /**
   * Function to handle search
   */
  onSearch: () => void;
  /**
   * Whether search is currently loading
   */
  loading: boolean;
  /**
   * Function to toggle filters visibility
   */
  onToggleFilters: () => void;
  /**
   * Function to handle query refinement
   */
  onRefineQuery: () => void;
  /**
   * Whether refinement is currently loading
   */
  refinementLoading: boolean;
}

/**
 * ContentSourceManagement component handles the content source selection toggle,
 * selected content summary, and search input controls.
 */
export const ContentSourceManagement: React.FC<ContentSourceManagementProps> = ({
  searchQuery,
  onSearchQueryChange,
  onToggleContentSelector,
  showContentSelector,
  selectedContent,
  onSearch,
  loading,
  onToggleFilters,
  onRefineQuery,
  refinementLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          AI-Powered Search Options
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleContentSelector}
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
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={selectedContent.length > 0 
                  ? "Query generated from selected content (you can modify it)" 
                  : "Enter your search query (e.g., 'machine learning in education')"
                }
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              />
              <Button
                variant="outline"
                onClick={onToggleFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button
                variant="outline"
                onClick={onRefineQuery}
                disabled={refinementLoading || !searchQuery.trim()}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {refinementLoading ? 'Analyzing...' : 'Refine'}
              </Button>
              <Button
                onClick={onSearch}
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
  );
};