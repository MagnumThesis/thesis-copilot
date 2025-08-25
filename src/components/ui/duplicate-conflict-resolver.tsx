"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Label } from "./shadcn/label"
import { RadioGroup, RadioGroupItem } from "./shadcn/radio-group"
import { Textarea } from "./shadcn/textarea"
import { Input } from "./shadcn/input"
import { ScholarSearchResult } from "../../lib/ai-types"
import { DuplicateGroup, DuplicateConflict, MergedResult } from "../../worker/lib/duplicate-detection-engine"
import { AlertTriangle, CheckCircle, XCircle, Merge, Eye, EyeOff } from "lucide-react"

interface DuplicateConflictResolverProps {
  duplicateGroups: DuplicateGroup[]
  onResolveConflicts: (resolvedResults: ScholarSearchResult[]) => void
  onCancel: () => void
}

interface ConflictResolution {
  groupIndex: number
  field: keyof ScholarSearchResult
  selectedValue: any
  customValue?: any
}

export const DuplicateConflictResolver: React.FC<DuplicateConflictResolverProps> = ({
  duplicateGroups,
  onResolveConflicts,
  onCancel
}) => {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(new Map())
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]))
  const [showDetails, setShowDetails] = useState<Set<number>>(new Set())

  const handleResolutionChange = (
    groupIndex: number,
    field: keyof ScholarSearchResult,
    value: any,
    isCustom: boolean = false
  ) => {
    const key = `${groupIndex}-${field}`
    setResolutions(prev => new Map(prev.set(key, {
      groupIndex,
      field,
      selectedValue: value,
      customValue: isCustom ? value : undefined
    })))
  }

  const getFieldConflicts = (group: DuplicateGroup): DuplicateConflict[] => {
    const allResults = [group.primary, ...group.duplicates]
    const conflicts: DuplicateConflict[] = []
    
    const fields: (keyof ScholarSearchResult)[] = [
      'title', 'authors', 'journal', 'year', 'doi', 'url', 'abstract', 'citations'
    ]

    for (const field of fields) {
      const values = allResults.map((r, i) => ({
        value: r[field],
        source: i === 0 ? 'Primary' : `Duplicate ${i}`,
        confidence: r.confidence
      })).filter(v => v.value !== undefined && v.value !== null && v.value !== '')

      if (values.length > 1) {
        const uniqueValues = getUniqueFieldValues(values, field)
        
        if (uniqueValues.length > 1) {
          conflicts.push({
            field,
            values: uniqueValues,
            suggestedResolution: getSuggestedResolution(uniqueValues, field)
          })
        }
      }
    }

    return conflicts
  }

  const getUniqueFieldValues = (values: Array<{value: any; source: string; confidence: number}>, field: keyof ScholarSearchResult) => {
    const uniqueMap = new Map<string, {value: any; source: string; confidence: number}>()

    for (const item of values) {
      const key = getValueKey(item.value, field)
      if (!uniqueMap.has(key) || uniqueMap.get(key)!.confidence < item.confidence) {
        uniqueMap.set(key, item)
      }
    }

    return Array.from(uniqueMap.values())
  }

  const getValueKey = (value: any, field: keyof ScholarSearchResult): string => {
    if (Array.isArray(value)) {
      return JSON.stringify(value.sort())
    }
    if (typeof value === 'string') {
      return field === 'title' ? value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() : value.toLowerCase()
    }
    return String(value)
  }

  const getSuggestedResolution = (values: Array<{value: any; source: string; confidence: number}>, field: keyof ScholarSearchResult): any => {
    const sorted = values.sort((a, b) => b.confidence - a.confidence)
    
    if (field === 'citations') {
      return Math.max(...values.map(v => v.value as number))
    }
    
    if (field === 'authors' || field === 'keywords') {
      const allValues = values.flatMap(v => v.value as string[])
      return [...new Set(allValues)]
    }

    return sorted[0].value
  }

  const toggleGroupExpansion = (groupIndex: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupIndex)) {
        newSet.delete(groupIndex)
      } else {
        newSet.add(groupIndex)
      }
      return newSet
    })
  }

  const toggleDetails = (groupIndex: number) => {
    setShowDetails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupIndex)) {
        newSet.delete(groupIndex)
      } else {
        newSet.add(groupIndex)
      }
      return newSet
    })
  }

  const renderFieldValue = (value: any, field: keyof ScholarSearchResult): string => {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    if (value === null || value === undefined) {
      return 'Not available'
    }
    return String(value)
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800'
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getMergeStrategyIcon = (strategy: DuplicateGroup['mergeStrategy']) => {
    switch (strategy) {
      case 'doi':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'title_author':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'url':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'fuzzy_match':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getMergeStrategyDescription = (strategy: DuplicateGroup['mergeStrategy']): string => {
    switch (strategy) {
      case 'doi':
        return 'Matched by DOI (highest confidence)'
      case 'title_author':
        return 'Matched by title and author similarity'
      case 'url':
        return 'Matched by URL'
      case 'fuzzy_match':
        return 'Matched by fuzzy text similarity'
      default:
        return 'Unknown matching strategy'
    }
  }

  const handleResolveAll = () => {
    const resolvedResults: ScholarSearchResult[] = []

    duplicateGroups.forEach((group, groupIndex) => {
      const conflicts = getFieldConflicts(group)
      const mergedResult: MergedResult = {
        ...group.primary,
        mergedFrom: [group.primary, ...group.duplicates].map((_, i) => `result_${i}`),
        mergeConfidence: group.confidence,
        conflictingFields: conflicts.map(c => c.field as string)
      }

      // Apply user resolutions
      conflicts.forEach(conflict => {
        const key = `${groupIndex}-${conflict.field}`
        const resolution = resolutions.get(key)
        
        if (resolution) {
          (mergedResult as any)[conflict.field] = resolution.customValue || resolution.selectedValue
        } else {
          // Use suggested resolution
          (mergedResult as any)[conflict.field] = conflict.suggestedResolution
        }
      })

      resolvedResults.push(mergedResult)
    })

    onResolveConflicts(resolvedResults)
  }

  const hasUnresolvedConflicts = (): boolean => {
    return duplicateGroups.some((group, groupIndex) => {
      const conflicts = getFieldConflicts(group)
      return conflicts.some(conflict => {
        const key = `${groupIndex}-${conflict.field}`
        return !resolutions.has(key)
      })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Merge className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Resolve Duplicate Conflicts</h3>
          <Badge variant="outline">
            {duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''} found
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleResolveAll}
            disabled={hasUnresolvedConflicts()}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve All Conflicts
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="font-medium text-blue-800 mb-2">Duplicate Detection Results</p>
        <p>
          We found {duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''} of duplicate search results. 
          Please review the conflicts below and choose how to resolve them. The system has provided suggested resolutions 
          based on confidence scores and data quality.
        </p>
      </div>

      {duplicateGroups.map((group, groupIndex) => {
        const conflicts = getFieldConflicts(group)
        const isExpanded = expandedGroups.has(groupIndex)
        const showGroupDetails = showDetails.has(groupIndex)

        return (
          <Card key={groupIndex} className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {getMergeStrategyIcon(group.mergeStrategy)}
                  Duplicate Group {groupIndex + 1}
                  <Badge className={getConfidenceColor(group.confidence)}>
                    {Math.round(group.confidence * 100)}% confidence
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDetails(groupIndex)}
                    className="flex items-center gap-1"
                  >
                    {showGroupDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showGroupDetails ? 'Hide' : 'Show'} Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleGroupExpansion(groupIndex)}
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {getMergeStrategyDescription(group.mergeStrategy)} • 
                {1 + group.duplicates.length} results will be merged • 
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} to resolve
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4">
                {/* Show all results in group if details are enabled */}
                {showGroupDetails && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Results in this group:</h4>
                    {[group.primary, ...group.duplicates].map((result, resultIndex) => (
                      <div key={resultIndex} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={resultIndex === 0 ? "default" : "secondary"}>
                            {resultIndex === 0 ? 'Primary' : `Duplicate ${resultIndex}`}
                          </Badge>
                          <Badge className={getConfidenceColor(result.confidence)}>
                            {Math.round(result.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium">{result.title}</div>
                          <div className="text-muted-foreground">
                            {result.authors.join(', ')} • {result.journal} • {result.year}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Conflict resolution */}
                {conflicts.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium">Resolve Conflicts:</h4>
                    {conflicts.map((conflict, conflictIndex) => {
                      const key = `${groupIndex}-${conflict.field}`
                      const currentResolution = resolutions.get(key)

                      return (
                        <div key={conflictIndex} className="p-4 border rounded-lg">
                          <Label className="text-base font-medium capitalize">
                            {conflict.field.replace('_', ' ')}
                          </Label>
                          <div className="mt-2 space-y-3">
                            <RadioGroup
                              value={currentResolution?.selectedValue || ''}
                              onValueChange={(value) => handleResolutionChange(groupIndex, conflict.field, value)}
                            >
                              {conflict.values.map((valueOption, valueIndex) => (
                                <div key={valueIndex} className="flex items-start space-x-2">
                                  <RadioGroupItem 
                                    value={JSON.stringify(valueOption.value)} 
                                    id={`${key}-${valueIndex}`}
                                  />
                                  <div className="flex-1">
                                    <Label 
                                      htmlFor={`${key}-${valueIndex}`}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <span className="font-medium">{valueOption.source}:</span>
                                      <span>{renderFieldValue(valueOption.value, conflict.field)}</span>
                                      <Badge className={getConfidenceColor(valueOption.confidence)}>
                                        {Math.round(valueOption.confidence * 100)}%
                                      </Badge>
                                    </Label>
                                  </div>
                                </div>
                              ))}
                              
                              {/* Suggested resolution option */}
                              <div className="flex items-start space-x-2 border-t pt-3">
                                <RadioGroupItem 
                                  value={JSON.stringify(conflict.suggestedResolution)} 
                                  id={`${key}-suggested`}
                                />
                                <div className="flex-1">
                                  <Label 
                                    htmlFor={`${key}-suggested`}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <span className="font-medium text-green-700">Suggested:</span>
                                    <span>{renderFieldValue(conflict.suggestedResolution, conflict.field)}</span>
                                    <Badge className="bg-green-100 text-green-800">
                                      Recommended
                                    </Badge>
                                  </Label>
                                </div>
                              </div>

                              {/* Custom value option */}
                              <div className="flex items-start space-x-2 border-t pt-3">
                                <RadioGroupItem 
                                  value="custom" 
                                  id={`${key}-custom`}
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`${key}-custom`} className="font-medium">
                                    Custom value:
                                  </Label>
                                  {conflict.field === 'abstract' ? (
                                    <Textarea
                                      placeholder="Enter custom value..."
                                      className="mt-2"
                                      onChange={(e) => handleResolutionChange(groupIndex, conflict.field, e.target.value, true)}
                                    />
                                  ) : (
                                    <Input
                                      placeholder="Enter custom value..."
                                      className="mt-2"
                                      onChange={(e) => handleResolutionChange(groupIndex, conflict.field, e.target.value, true)}
                                    />
                                  )}
                                </div>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>No conflicts detected. Results can be merged automatically.</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}

      {duplicateGroups.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
          <p>No duplicate conflicts found.</p>
          <p className="text-sm">All search results are unique.</p>
        </div>
      )}
    </div>
  )
}