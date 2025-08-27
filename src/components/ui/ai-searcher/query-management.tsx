import React from "react";
import { Button } from "../shadcn/button";
import { Input } from "../shadcn/input";
import { Label } from "../shadcn/label";
import { Filter, Zap, Search } from "lucide-react";
import { ExtractedContent } from "../../../lib/ai-types";

/**
 * Props for the QueryManagement component
 */
export interface QueryManagementProps {
  /**
   * The current search query
   */
  searchQuery: string;
  /**
   * Function to update the search query
   */
  onSearchQueryChange: (query: string) => void;
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
  /**
   * Array of selected content
   */
  selectedContent: ExtractedContent[];
}

/**
 * QueryManagement component handles the search input, filters button, 
 * refine button, and search button.
 */
export const QueryManagement: React.FC<QueryManagementProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  loading,
  onToggleFilters,
  onRefineQuery,
  refinementLoading,
  selectedContent
}) => {
  return (
    <div className="space-y-4">
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
  );
};