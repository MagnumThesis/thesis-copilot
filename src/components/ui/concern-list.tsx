"use client"

import React, { useState, useMemo, useRef, useEffect } from "react"
import { ProofreadingConcern, ConcernStatus, ConcernCategory, ConcernSeverity, safeDate } from "@/lib/ai-types"
import { ConcernDetail } from "./concern-detail"
import { Button } from "@/components/ui/shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select"
import { Badge } from "@/components/ui/shadcn/badge"
import { Separator } from "@/components/ui/shadcn/separator"
import { Filter, SortAsc, SortDesc } from "lucide-react"
import { useVirtualScroll } from "@/hooks/use-virtual-scroll"
import { proofreaderPerformanceMonitor } from "@/lib/proofreader-performance-monitor"
import { useAccessibility, useLiveRegion } from "@/hooks/use-accessibility"
import { AccessibleTooltip } from "@/components/ui/accessible-tooltip"

interface ConcernListProps {
  concerns: ProofreadingConcern[]
  onStatusChange: (concernId: string, status: ConcernStatus) => void
  statusFilter: ConcernStatus | 'all'
  onFilterChange: (filter: ConcernStatus | 'all') => void
}

type SortOption = 'severity' | 'category' | 'created' | 'updated'
type SortDirection = 'asc' | 'desc'

/**
 * Displays a filterable and sortable list of proofreading concerns.
 * It supports filtering by status, category, and severity, and sorting by severity, category, creation, or update date.
 * It also implements virtual scrolling for performance with large lists.
 * @param {ConcernListProps} props - The properties for the ConcernList component.
 * @param {ProofreadingConcern[]} props.concerns - An array of proofreading concerns to display.
 * @param {(concernId: string, status: ConcernStatus) => void} props.onStatusChange - Callback function to update the status of a concern.
 * @param {ConcernStatus | 'all'} props.statusFilter - The current filter for concern status.
 * @param {(filter: ConcernStatus | 'all') => void} props.onFilterChange - Callback function to change the status filter.
 * @example
 * ```tsx
 * import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from "@/lib/ai-types";
 *
 * const sampleConcerns: ProofreadingConcern[] = [
 *   {
 *     id: "c1",
 *     title: "Sentence fragment",
 *     description: "This sentence is incomplete and lacks a main verb.",
 *     severity: ConcernSeverity.HIGH,
 *     category: ConcernCategory.GRAMMAR,
 *     status: ConcernStatus.TO_BE_DONE,
 *     suggestions: ["Add a verb to complete the sentence."],
 *     relatedIdeas: [],
 *     location: { section: "Introduction", paragraph: 2, context: "A fragmented sentence." },
 *     createdAt: new Date().toISOString(),
 *     updatedAt: new Date().toISOString(),
 *   },
 *   {
 *     id: "c2",
 *     title: "Ambiguous pronoun reference",
 *     description: "The pronoun 'it' could refer to multiple antecedents.",
 *     severity: ConcernSeverity.MEDIUM,
 *     category: ConcernCategory.CLARITY,
 *     status: ConcernStatus.ADDRESSED,
 *     suggestions: ["Clarify the antecedent of the pronoun."],
 *     relatedIdeas: [],
 *     location: { section: "Body", paragraph: 5, context: "An ambiguous reference." },
 *     createdAt: new Date().toISOString(),
 *     updatedAt: new Date().toISOString(),
 *   },
 * ];
 *
 * <ConcernList
 *   concerns={sampleConcerns}
 *   onStatusChange={(id, status) => console.log(`Concern ${id} status changed to ${status}`)}
 *   statusFilter="all"
 *   onFilterChange={(filter) => console.log('Filter changed to:', filter)}
 * />
 * ```
 */
export const ConcernList: React.FC<ConcernListProps> = ({
  concerns,
  onStatusChange,
  statusFilter,
  onFilterChange
}) => {
  // Accessibility hooks
  const { preferences, getAccessibilityClasses, generateId } = useAccessibility()
  const { announce } = useLiveRegion()
  const [categoryFilter, setCategoryFilter] = useState<ConcernCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<ConcernSeverity | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('severity')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [expandedConcerns, setExpandedConcerns] = useState<Set<string>>(new Set())
  const [focusedConcernIndex, setFocusedConcernIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)
  const concernRefs = useRef<(HTMLDivElement | null)[]>([])
  const listId = generateId('concern-list')

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
      case 'created': {
        const aCreated = safeDate(a.createdAt);
        const bCreated = safeDate(b.createdAt);
        comparison = (aCreated?.getTime() ?? 0) - (bCreated?.getTime() ?? 0);
        break;
      }
      case 'updated': {
        const aUpdated = safeDate(a.updatedAt);
        const bUpdated = safeDate(b.updatedAt);
        comparison = (aUpdated?.getTime() ?? 0) - (bUpdated?.getTime() ?? 0);
        break;
      }
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Note: concernsByStatus removed as it was unused

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
    const concern = sortedConcerns.find(c => c.id === concernId)
    const isExpanding = !expandedConcerns.has(concernId)
    
    setExpandedConcerns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(concernId)) {
        newSet.delete(concernId)
      } else {
        newSet.add(concernId)
      }
      return newSet
    })

    // Announce expansion state change
    if (concern) {
      announce(`${concern.title} ${isExpanding ? 'expanded' : 'collapsed'}`)
    }
  }

  const expandAllConcerns = () => {
    setExpandedConcerns(new Set(sortedConcerns.map(c => c.id)))
    announce(`Expanded all ${sortedConcerns.length} concerns`)
  }

  const collapseAllConcerns = () => {
    setExpandedConcerns(new Set())
    announce(`Collapsed all concerns`)
  }

  // Keyboard navigation handlers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (sortedConcerns.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedConcernIndex(prev => {
          const newIndex = Math.min(prev + 1, sortedConcerns.length - 1)
          concernRefs.current[newIndex]?.focus()
          return newIndex
        })
        break
      case 'ArrowUp':
        event.preventDefault()
        setFocusedConcernIndex(prev => {
          const newIndex = Math.max(prev - 1, 0)
          concernRefs.current[newIndex]?.focus()
          return newIndex
        })
        break
      case 'Home':
        event.preventDefault()
        setFocusedConcernIndex(0)
        concernRefs.current[0]?.focus()
        break
      case 'End':
        event.preventDefault()
        const lastIndex = sortedConcerns.length - 1
        setFocusedConcernIndex(lastIndex)
        concernRefs.current[lastIndex]?.focus()
        break
      case 'Enter':
      case ' ':
        if (focusedConcernIndex >= 0) {
          event.preventDefault()
          toggleConcernExpansion(sortedConcerns[focusedConcernIndex].id)
        }
        break
    }
  }

  // Note: handleConcernFocus removed as it was unused

  const getStatusLabel = (status: ConcernStatus | 'all') => {
    switch (status) {
      case ConcernStatus.TO_BE_DONE: {
        return 'To be done'
      }
      case ConcernStatus.ADDRESSED: {
        return 'Addressed'
      }
      case ConcernStatus.REJECTED: {
        return 'Rejected'
      }
      case 'all': {
        return 'All concerns'
      }
      default: {
        return 'All concerns'
      }
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
    <div 
      className={`space-y-4 ${getAccessibilityClasses()}`}
      data-testid="concern-list-container"
      onKeyDown={handleKeyDown}
      role="region"
      aria-labelledby={`${listId}-heading`}
      aria-describedby={`${listId}-description`}
    >
      {/* Header with count and expand/collapse controls */}
      <div className="flex items-center justify-between">
        <h3 id={`${listId}-heading`} className="text-sm font-medium">
          {sortedConcerns.length} {sortedConcerns.length === 1 ? 'concern' : 'concerns'}
          {sortedConcerns.length !== concerns.length && (
            <span className="text-muted-foreground"> (filtered from {concerns.length})</span>
          )}
        </h3>
        {sortedConcerns.length > 0 && (
          <div className="flex gap-2">
            <AccessibleTooltip 
              content="Expand all concerns to show full details"
              type="help"
              hotkey="Ctrl+E"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAllConcerns}
                className="text-xs"
                aria-label="Expand all concerns"
              >
                Expand All
              </Button>
            </AccessibleTooltip>
            <AccessibleTooltip 
              content="Collapse all concerns to show only titles"
              type="help"
              hotkey="Ctrl+C"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAllConcerns}
                className="text-xs"
                aria-label="Collapse all concerns"
              >
                Collapse All
              </Button>
            </AccessibleTooltip>
          </div>
        )}
      </div>

      {/* Enhanced Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span>Filters & Sorting</span>
        </div>
        
        <div id={`${listId}-description`} className="sr-only">
          Use arrow keys to navigate concerns, Enter or Space to expand/collapse, Home/End to jump to first/last concern.
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Status Filter */}
          <AccessibleTooltip 
            content="Filter concerns by their current status: pending, addressed, or rejected"
            type="help"
          >
            <Select value={statusFilter} onValueChange={onFilterChange}>
              <SelectTrigger 
                className="text-xs"
                aria-label="Filter concerns by status"
              >
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
          </AccessibleTooltip>

          {/* Category Filter */}
          <AccessibleTooltip 
            content="Filter concerns by category such as clarity, structure, citations, etc."
            type="help"
          >
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as ConcernCategory | 'all')}>
              <SelectTrigger 
                className="text-xs"
                aria-label="Filter concerns by category"
              >
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
          </AccessibleTooltip>
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
