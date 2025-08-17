"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { ProofreadingConcern, ConcernStatus, ConcernCategory, ConcernSeverity } from "@/lib/ai-types"
import { ConcernDetail } from "./concern-detail"
import { Button } from "@/components/ui/shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select"
import { Badge } from "@/components/ui/shadcn/badge"
import { Separator } from "@/components/ui/shadcn/separator"
import { Filter, SortAsc, SortDesc } from "lucide-react"
import { useVirtualScroll } from "@/hooks/use-virtual-scroll"
import { proofreaderPerformanceMonitor } from "@/lib/proofreader-performance-monitor"

interface ConcernListProps {
  concerns: ProofreadingConcern[]
  onStatusChange: (concernId: string, status: ConcernStatus) => void
  statusFilter: ConcernStatus | 'all'
  onFilterChange: (filter: ConcernStatus | 'all') => void
}

type SortOption = 'severity' | 'category' | 'created' | 'updated'
type SortDirection = 'asc' | 'desc'

export const ConcernList: React.FC<ConcernListProps> = ({
  concerns,
  onStatusChange,
  statusFilter,
  onFilterChange
}) => {
  const [categoryFilter, setCategoryFilter] = useState<ConcernCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<ConcernSeverity | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('severity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedConcerns, setExpandedConcerns] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  // Filter concerns based on all filters with performance monitoring
  const filteredConcerns = useMemo(() => {
    if (concerns.length > 100) {
      // Monitor performance for large lists
      return proofreaderPerformanceMonitor.measureSync(
        'concern_filtering',
        () => concerns.filter(concern => {
          // Status filter
          if (statusFilter !== 'all' && concern.status !== statusFilter) return false
          
          // Category filter
          if (categoryFilter !== 'all' && concern.category !== categoryFilter) return false
          
          // Severity filter
          if (severityFilter !== 'all' && concern.severity !== severityFilter) return false
          
          return true
        }),
        { totalConcerns: concerns.length, filters: { statusFilter, categoryFilter, severityFilter } }
      ).result;
    }
    
    return concerns.filter(concern => {
      // Status filter
      if (statusFilter !== 'all' && concern.status !== statusFilter) return false
      
      // Category filter
      if (categoryFilter !== 'all' && concern.category !== categoryFilter) return false
      
      // Severity filter
      if (severityFilter !== 'all' && concern.severity !== severityFilter) return false
      
      return true
    });
  }, [concerns, statusFilter, categoryFilter, severityFilter])

  // Sort concerns
  const sortedConcerns = [...filteredConcerns].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'severity':
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        comparison = severityOrder[a.severity] - severityOrder[b.severity]
        break
      case 'category':
        comparison = a.category.localeCompare(b.category)
        break
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Group concerns by status for display
  const concernsByStatus = {
    [ConcernStatus.TO_BE_DONE]: sortedConcerns.filter(c => c.status === ConcernStatus.TO_BE_DONE),
    [ConcernStatus.ADDRESSED]: sortedConcerns.filter(c => c.status === ConcernStatus.ADDRESSED),
    [ConcernStatus.REJECTED]: sortedConcerns.filter(c => c.status === ConcernStatus.REJECTED)
  }

  // Use virtual scrolling for large lists (>20 items)
  const useVirtualScrolling = sortedConcerns.length > 20;
  const itemHeight = 120; // Approximate height of each concern item

  const virtualScrollResult = useVirtualScroll(sortedConcerns, {
    itemHeight,
    containerHeight,
    overscan: 3
  });

  // Update container height when component mounts or resizes
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const maxHeight = Math.min(600, window.innerHeight - rect.top - 100);
        setContainerHeight(maxHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Memoize rendered concerns for performance
  const renderedConcerns = useMemo(() => {
    if (!useVirtualScrolling) {
      return sortedConcerns;
    }
    return virtualScrollResult.virtualItems.map(item => item.item);
  }, [useVirtualScrolling, sortedConcerns, virtualScrollResult.virtualItems]);

  const toggleConcernExpansion = (concernId: string) => {
    setExpandedConcerns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(concernId)) {
        newSet.delete(concernId)
      } else {
        newSet.add(concernId)
      }
      return newSet
    })
  }

  const expandAllConcerns = () => {
    setExpandedConcerns(new Set(sortedConcerns.map(c => c.id)))
  }

  const collapseAllConcerns = () => {
    setExpandedConcerns(new Set())
  }

  const getStatusLabel = (status: ConcernStatus | 'all') => {
    switch (status) {
      case ConcernStatus.TO_BE_DONE:
        return 'To be done'
      case ConcernStatus.ADDRESSED:
        return 'Addressed'
      case ConcernStatus.REJECTED:
        return 'Rejected'
      case 'all':
        return 'All concerns'
      default:
        return 'All concerns'
    }
  }

  const getStatusCount = (status: ConcernStatus | 'all') => {
    if (status === 'all') return concerns.length
    return concerns.filter(c => c.status === status).length
  }

  const getCategoryLabel = (category: ConcernCategory | 'all') => {
    if (category === 'all') return 'All categories'
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getSeverityLabel = (severity: ConcernSeverity | 'all') => {
    if (severity === 'all') return 'All severities'
    return severity.charAt(0).toUpperCase() + severity.slice(1)
  }

  const getCategoryCount = (category: ConcernCategory | 'all') => {
    if (category === 'all') return concerns.length
    return concerns.filter(c => c.category === category).length
  }

  const getSeverityCount = (severity: ConcernSeverity | 'all') => {
    if (severity === 'all') return concerns.length
    return concerns.filter(c => c.severity === severity).length
  }

  return (
    <div className="space-y-4">
      {/* Header with count and expand/collapse controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {sortedConcerns.length} {sortedConcerns.length === 1 ? 'concern' : 'concerns'}
          {sortedConcerns.length !== concerns.length && (
            <span className="text-muted-foreground"> (filtered from {concerns.length})</span>
          )}
        </h3>
        {sortedConcerns.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllConcerns}
              className="text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAllConcerns}
              className="text-xs"
            >
              Collapse All
            </Button>
          </div>
        )}
      </div>

      {/* Enhanced Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span>Filters & Sorting</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={onFilterChange}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status ({getStatusCount('all')})</SelectItem>
              <SelectItem value={ConcernStatus.TO_BE_DONE}>
                To be done ({getStatusCount(ConcernStatus.TO_BE_DONE)})
              </SelectItem>
              <SelectItem value={ConcernStatus.ADDRESSED}>
                Addressed ({getStatusCount(ConcernStatus.ADDRESSED)})
              </SelectItem>
              <SelectItem value={ConcernStatus.REJECTED}>
                Rejected ({getStatusCount(ConcernStatus.REJECTED)})
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ConcernCategory | 'all')}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories ({getCategoryCount('all')})</SelectItem>
              {Object.values(ConcernCategory).map(category => (
                <SelectItem key={category} value={category}>
                  {getCategoryLabel(category)} ({getCategoryCount(category)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Severity Filter */}
          <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as ConcernSeverity | 'all')}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities ({getSeverityCount('all')})</SelectItem>
              {Object.values(ConcernSeverity).map(severity => (
                <SelectItem key={severity} value={severity}>
                  {getSeverityLabel(severity)} ({getSeverityCount(severity)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <div className="flex gap-1">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="text-xs flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="severity">Severity</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-2"
            >
              {sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(statusFilter !== 'all' || categoryFilter !== 'all' || severityFilter !== 'all') && (
          <div className="flex flex-wrap gap-1">
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Status: {getStatusLabel(statusFilter)}
                <button
                  onClick={() => onFilterChange('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {categoryFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Category: {getCategoryLabel(categoryFilter)}
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {severityFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Severity: {getSeverityLabel(severityFilter)}
                <button
                  onClick={() => setSeverityFilter('all')}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Concerns List */}
      {sortedConcerns.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {concerns.length === 0 
            ? "No concerns found. Run an analysis to get started."
            : "No concerns match the current filters."
          }
          {concerns.length > 0 && sortedConcerns.length === 0 && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onFilterChange('all')
                  setCategoryFilter('all')
                  setSeverityFilter('all')
                }}
                className="text-xs"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      ) : useVirtualScrolling ? (
        // Virtual scrolling for large lists
        <div ref={containerRef}>
          <div {...virtualScrollResult.scrollElementProps}>
            <div {...virtualScrollResult.containerProps}>
              {virtualScrollResult.virtualItems.map((virtualItem) => (
                <div
                  key={virtualItem.item.id}
                  style={{
                    position: 'absolute',
                    top: virtualItem.offsetTop,
                    left: 0,
                    right: 0,
                    height: itemHeight
                  }}
                >
                  <div className="px-1 pb-3">
                    <ConcernDetail
                      concern={virtualItem.item}
                      onStatusChange={(status) => onStatusChange(virtualItem.item.id, status)}
                      isExpanded={expandedConcerns.has(virtualItem.item.id)}
                      onToggleExpanded={() => toggleConcernExpansion(virtualItem.item.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {useVirtualScrolling && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Showing {virtualScrollResult.virtualItems.length} of {sortedConcerns.length} concerns
              {virtualScrollResult.isScrolling && " • Scrolling..."}
            </div>
          )}
        </div>
      ) : (
        // Regular rendering for smaller lists
        <div className="space-y-3">
          {renderedConcerns.map((concern) => (
            <ConcernDetail
              key={concern.id}
              concern={concern}
              onStatusChange={(status) => onStatusChange(concern.id, status)}
              isExpanded={expandedConcerns.has(concern.id)}
              onToggleExpanded={() => toggleConcernExpansion(concern.id)}
            />
          ))}
        </div>
      )}

      {/* Summary Statistics */}
      {concerns.length > 0 && (
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-yellow-600">
                {getStatusCount(ConcernStatus.TO_BE_DONE)}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-green-600">
                {getStatusCount(ConcernStatus.ADDRESSED)}
              </div>
              <div className="text-xs text-muted-foreground">Addressed</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold text-red-600">
                {getStatusCount(ConcernStatus.REJECTED)}
              </div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>
          
          {/* Quick Filter Actions */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            <Button
              variant={statusFilter === ConcernStatus.TO_BE_DONE ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(ConcernStatus.TO_BE_DONE)}
              className="text-xs"
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === ConcernStatus.ADDRESSED ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(ConcernStatus.ADDRESSED)}
              className="text-xs"
            >
              Addressed
            </Button>
            <Button
              variant={statusFilter === 'all' ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange('all')}
              className="text-xs"
            >
              All
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}