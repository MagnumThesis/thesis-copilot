"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Label } from "./shadcn/label"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Separator } from "./shadcn/separator"
import { SearchFilters } from "../../lib/ai-types"
import { Filter, X, Calendar, Users, BookOpen, TrendingUp, RotateCcw } from "lucide-react"

interface SearchFiltersPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onReset: () => void
  isVisible: boolean
  onToggleVisibility: () => void
}

export const SearchFiltersPanel: React.FC<SearchFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  onReset,
  isVisible,
  onToggleVisibility
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters)

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value }
    setLocalFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const year = parseInt(value)
    if (isNaN(year)) return

    const dateRange = localFilters.dateRange || { start: 1900, end: new Date().getFullYear() }
    const updatedDateRange = { ...dateRange, [field]: year }
    handleFilterChange('dateRange', updatedDateRange)
  }

  const handleAuthorsChange = (value: string) => {
    const authors = value.split(',').map(author => author.trim()).filter(Boolean)
    handleFilterChange('authors', authors)
  }

  const handleJournalsChange = (value: string) => {
    const journals = value.split(',').map(journal => journal.trim()).filter(Boolean)
    handleFilterChange('journals', journals)
  }

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
      sortBy: 'relevance'
    }
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
    onReset()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.dateRange) count++
    if (localFilters.authors && localFilters.authors.length > 0) count++
    if (localFilters.journals && localFilters.journals.length > 0) count++
    if (localFilters.minCitations && localFilters.minCitations > 0) count++
    if (localFilters.maxResults && localFilters.maxResults !== 50) count++
    return count
  }

  const currentYear = new Date().getFullYear()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <span>Search Filters</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleVisibility}
            >
              {isVisible ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="space-y-6">
          {/* Publication Date Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Publication Date Range</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start-year" className="text-sm text-muted-foreground">
                  From Year
                </Label>
                <Input
                  id="start-year"
                  type="number"
                  min="1900"
                  max={currentYear}
                  placeholder="1900"
                  value={localFilters.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-year" className="text-sm text-muted-foreground">
                  To Year
                </Label>
                <Input
                  id="end-year"
                  type="number"
                  min="1900"
                  max={currentYear}
                  placeholder={currentYear.toString()}
                  value={localFilters.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>
            {localFilters.dateRange && (
              <div className="text-sm text-muted-foreground">
                Filtering papers published between {localFilters.dateRange.start || 1900} and {localFilters.dateRange.end || currentYear}
              </div>
            )}
          </div>

          <Separator />

          {/* Authors Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="authors-filter" className="font-medium">Authors</Label>
            </div>
            <Input
              id="authors-filter"
              placeholder="Enter author names separated by commas (e.g., Smith, Johnson, Brown)"
              value={localFilters.authors?.join(', ') || ''}
              onChange={(e) => handleAuthorsChange(e.target.value)}
            />
            {localFilters.authors && localFilters.authors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localFilters.authors.map((author, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {author}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => {
                        const updatedAuthors = localFilters.authors?.filter((_, i) => i !== index) || []
                        handleFilterChange('authors', updatedAuthors)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Journals Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="journals-filter" className="font-medium">Journals</Label>
            </div>
            <Input
              id="journals-filter"
              placeholder="Enter journal names separated by commas (e.g., Nature, Science, Cell)"
              value={localFilters.journals?.join(', ') || ''}
              onChange={(e) => handleJournalsChange(e.target.value)}
            />
            {localFilters.journals && localFilters.journals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localFilters.journals.map((journal, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {journal}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => {
                        const updatedJournals = localFilters.journals?.filter((_, i) => i !== index) || []
                        handleFilterChange('journals', updatedJournals)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Citation Count Filter */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="min-citations" className="font-medium">Minimum Citation Count</Label>
            </div>
            <Input
              id="min-citations"
              type="number"
              min="0"
              placeholder="0"
              value={localFilters.minCitations || ''}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                handleFilterChange('minCitations', isNaN(value) ? undefined : value)
              }}
            />
            {localFilters.minCitations && localFilters.minCitations > 0 && (
              <div className="text-sm text-muted-foreground">
                Only showing papers with at least {localFilters.minCitations} citations
              </div>
            )}
          </div>

          <Separator />

          {/* Results Limit */}
          <div className="space-y-3">
            <Label htmlFor="max-results" className="font-medium">Maximum Results</Label>
            <Select
              value={localFilters.maxResults?.toString() || '50'}
              onValueChange={(value) => handleFilterChange('maxResults', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select maximum results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 results</SelectItem>
                <SelectItem value="25">25 results</SelectItem>
                <SelectItem value="50">50 results</SelectItem>
                <SelectItem value="100">100 results</SelectItem>
                <SelectItem value="200">200 results</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Sort Options */}
          <div className="space-y-3">
            <Label htmlFor="sort-by" className="font-medium">Sort Results By</Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value as SearchFilters['sortBy'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="date">Publication Date (Newest First)</SelectItem>
                <SelectItem value="citations">Citation Count (Highest First)</SelectItem>
                <SelectItem value="quality">Overall Quality Score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Active Filters ({getActiveFiltersCount()})
              </div>
              <div className="space-y-1 text-xs text-blue-700">
                {localFilters.dateRange && (
                  <div>• Publication years: {localFilters.dateRange.start || 1900} - {localFilters.dateRange.end || currentYear}</div>
                )}
                {localFilters.authors && localFilters.authors.length > 0 && (
                  <div>• Authors: {localFilters.authors.join(', ')}</div>
                )}
                {localFilters.journals && localFilters.journals.length > 0 && (
                  <div>• Journals: {localFilters.journals.join(', ')}</div>
                )}
                {localFilters.minCitations && localFilters.minCitations > 0 && (
                  <div>• Minimum citations: {localFilters.minCitations}</div>
                )}
                {localFilters.maxResults && localFilters.maxResults !== 50 && (
                  <div>• Maximum results: {localFilters.maxResults}</div>
                )}
                <div>• Sort by: {localFilters.sortBy}</div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}