"use client"

import React from "react"
import { ProofreadingConcern, ConcernStatus } from "@/lib/ai-types"
import { ConcernDetail } from "./concern-detail"
import { Button } from "@/components/ui/shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/shadcn/select"

interface ConcernListProps {
  concerns: ProofreadingConcern[]
  onStatusChange: (concernId: string, status: ConcernStatus) => void
  statusFilter: ConcernStatus | 'all'
  onFilterChange: (filter: ConcernStatus | 'all') => void
}

export const ConcernList: React.FC<ConcernListProps> = ({
  concerns,
  onStatusChange,
  statusFilter,
  onFilterChange
}) => {
  // Filter concerns based on status filter
  const filteredConcerns = concerns.filter(concern => {
    if (statusFilter === 'all') return true
    if (Object.values(ConcernStatus).includes(statusFilter as ConcernStatus)) {
      return concern.status === statusFilter
    }
    // For invalid filters, show all concerns
    return true
  })

  // Group concerns by status for display
  const concernsByStatus = {
    [ConcernStatus.TO_BE_DONE]: filteredConcerns.filter(c => c.status === ConcernStatus.TO_BE_DONE),
    [ConcernStatus.ADDRESSED]: filteredConcerns.filter(c => c.status === ConcernStatus.ADDRESSED),
    [ConcernStatus.REJECTED]: filteredConcerns.filter(c => c.status === ConcernStatus.REJECTED)
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

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {filteredConcerns.length} {filteredConcerns.length === 1 ? 'concern' : 'concerns'}
        </h3>
        <Select value={statusFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All concerns ({getStatusCount('all')})
            </SelectItem>
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
      </div>

      {/* Concerns List */}
      {filteredConcerns.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {statusFilter === 'all' 
            ? "No concerns found. Run an analysis to get started."
            : `No ${getStatusLabel(statusFilter).toLowerCase()} found.`
          }
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConcerns.map((concern) => (
            <ConcernDetail
              key={concern.id}
              concern={concern}
              onStatusChange={(status) => onStatusChange(concern.id, status)}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {concerns.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange(ConcernStatus.TO_BE_DONE)}
              className="text-xs"
            >
              Show pending ({getStatusCount(ConcernStatus.TO_BE_DONE)})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange(ConcernStatus.ADDRESSED)}
              className="text-xs"
            >
              Show addressed ({getStatusCount(ConcernStatus.ADDRESSED)})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange('all')}
              className="text-xs"
            >
              Show all ({getStatusCount('all')})
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}