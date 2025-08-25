"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Label } from "./shadcn/label"
import { Switch } from "./shadcn/switch"
import { Slider } from "./shadcn/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Badge } from "./shadcn/badge"
import { DuplicateDetectionOptions } from "../../worker/lib/duplicate-detection-engine"
import { Settings, Info, RotateCcw } from "lucide-react"

interface DeduplicationSettingsProps {
  options: DuplicateDetectionOptions
  onOptionsChange: (options: DuplicateDetectionOptions) => void
  onReset?: () => void
}

/**
 * A component for configuring the settings of the duplicate detection engine.
 * It allows users to adjust similarity thresholds, enable/disable fuzzy matching, strict DOI matching, and select a merge strategy.
 * @param {DeduplicationSettingsProps} props - The properties for the DeduplicationSettings component.
 * @param {DuplicateDetectionOptions} props.options - The current duplicate detection options.
 * @param {(options: DuplicateDetectionOptions) => void} props.onOptionsChange - Callback function to be called when any option changes.
 * @param {() => void} [props.onReset] - Optional callback function to reset settings to their default values.
 * @example
 * ```tsx
 * import React, { useState } from 'react';
 * import { DeduplicationSettings } from './deduplication-settings';
 * import { DuplicateDetectionOptions } from '../../worker/lib/duplicate-detection-engine';
 *
 * const DeduplicationSettingsExample = () => {
 *   const [options, setOptions] = useState<DuplicateDetectionOptions>({
 *     titleSimilarityThreshold: 0.85,
 *     authorSimilarityThreshold: 0.8,
 *     enableFuzzyMatching: true,
 *     strictDOIMatching: true,
 *     mergeStrategy: 'keep_highest_quality',
 *   });
 *
 *   return (
 *     <DeduplicationSettings
 *       options={options}
 *       onOptionsChange={setOptions}
 *       onReset={() => console.log('Reset to defaults')}
 *     />
 *   );
 * };
 *
 * export default DeduplicationSettingsExample;
 * ```
 */
export const DeduplicationSettings: React.FC<DeduplicationSettingsProps> = ({
  options,
  onOptionsChange,
  onReset
}) => {
  const [localOptions, setLocalOptions] = useState<DuplicateDetectionOptions>(options)

  const handleOptionChange = <K extends keyof DuplicateDetectionOptions>(
    key: K,
    value: DuplicateDetectionOptions[K]
  ) => {
    const newOptions = { ...localOptions, [key]: value }
    setLocalOptions(newOptions)
    onOptionsChange(newOptions)
  }

  const handleReset = () => {
    const defaultOptions: DuplicateDetectionOptions = {
      titleSimilarityThreshold: 0.85,
      authorSimilarityThreshold: 0.8,
      enableFuzzyMatching: true,
      strictDOIMatching: true,
      mergeStrategy: 'keep_highest_quality'
    }
    setLocalOptions(defaultOptions)
    onOptionsChange(defaultOptions)
    onReset?.()
  }

  const getSensitivityDescription = (threshold: number): string => {
    if (threshold >= 0.9) return 'Very Strict (fewer duplicates detected)'
    if (threshold >= 0.8) return 'Strict (balanced detection)'
    if (threshold >= 0.7) return 'Moderate (more duplicates detected)'
    if (threshold >= 0.6) return 'Lenient (many duplicates detected)'
    return 'Very Lenient (most duplicates detected)'
  }

  const getSensitivityColor = (threshold: number): string => {
    if (threshold >= 0.9) return 'bg-red-100 text-red-800'
    if (threshold >= 0.8) return 'bg-green-100 text-green-800'
    if (threshold >= 0.7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-orange-100 text-orange-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Duplicate Detection Settings
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Similarity Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Title Similarity Threshold</Label>
            <Badge className={getSensitivityColor(localOptions.titleSimilarityThreshold)}>
              {Math.round(localOptions.titleSimilarityThreshold * 100)}%
            </Badge>
          </div>
          <Slider
            value={[localOptions.titleSimilarityThreshold]}
            onValueChange={([value]) => handleOptionChange('titleSimilarityThreshold', value)}
            min={0.5}
            max={1.0}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50% (Very Lenient)</span>
            <span>100% (Exact Match)</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <Info className="h-4 w-4 inline mr-1" />
            {getSensitivityDescription(localOptions.titleSimilarityThreshold)}
          </div>
        </div>

        {/* Author Similarity Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Author Similarity Threshold</Label>
            <Badge className={getSensitivityColor(localOptions.authorSimilarityThreshold)}>
              {Math.round(localOptions.authorSimilarityThreshold * 100)}%
            </Badge>
          </div>
          <Slider
            value={[localOptions.authorSimilarityThreshold]}
            onValueChange={([value]) => handleOptionChange('authorSimilarityThreshold', value)}
            min={0.5}
            max={1.0}
            step={0.05}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50% (Very Lenient)</span>
            <span>100% (Exact Match)</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <Info className="h-4 w-4 inline mr-1" />
            How similar author names must be to consider results as duplicates
          </div>
        </div>

        {/* Fuzzy Matching */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Fuzzy Matching</Label>
              <div className="text-sm text-muted-foreground">
                Use advanced text similarity algorithms for better duplicate detection
              </div>
            </div>
            <Switch
              checked={localOptions.enableFuzzyMatching}
              onCheckedChange={(checked) => handleOptionChange('enableFuzzyMatching', checked)}
            />
          </div>
          {localOptions.enableFuzzyMatching && (
            <div className="ml-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <Info className="h-4 w-4 inline mr-1" />
                Fuzzy matching considers multiple factors including title similarity, author overlap, 
                publication year proximity, and journal similarity to detect duplicates that might 
                not be caught by exact matching.
              </div>
            </div>
          )}
        </div>

        {/* Strict DOI Matching */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Strict DOI Matching</Label>
              <div className="text-sm text-muted-foreground">
                Treat papers with identical DOIs as definite duplicates (recommended)
              </div>
            </div>
            <Switch
              checked={localOptions.strictDOIMatching}
              onCheckedChange={(checked) => handleOptionChange('strictDOIMatching', checked)}
            />
          </div>
          {localOptions.strictDOIMatching && (
            <div className="ml-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <Info className="h-4 w-4 inline mr-1" />
                DOI matching provides the highest confidence duplicate detection since DOIs 
                are unique identifiers for academic papers.
              </div>
            </div>
          )}
        </div>

        {/* Merge Strategy */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Merge Strategy</Label>
          <Select
            value={localOptions.mergeStrategy}
            onValueChange={(value: DuplicateDetectionOptions['mergeStrategy']) => 
              handleOptionChange('mergeStrategy', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="keep_highest_quality">
                Keep Highest Quality
              </SelectItem>
              <SelectItem value="keep_most_complete">
                Keep Most Complete
              </SelectItem>
              <SelectItem value="manual_review">
                Manual Review Required
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {localOptions.mergeStrategy === 'keep_highest_quality' && (
              <>
                <Info className="h-4 w-4 inline mr-1" />
                Automatically selects the best value for each field based on confidence scores, 
                citation counts, and data completeness.
              </>
            )}
            {localOptions.mergeStrategy === 'keep_most_complete' && (
              <>
                <Info className="h-4 w-4 inline mr-1" />
                Prioritizes completeness over quality, selecting non-empty values and merging 
                arrays when possible.
              </>
            )}
            {localOptions.mergeStrategy === 'manual_review' && (
              <>
                <Info className="h-4 w-4 inline mr-1" />
                Requires manual review for all conflicts, giving you full control over 
                how duplicates are merged.
              </>
            )}
          </div>
        </div>

        {/* Settings Summary */}
        <div className="p-4 bg-gray-50 border rounded-lg">
          <h4 className="font-medium mb-3">Current Settings Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Title Threshold:</span>
              <span className="ml-2">{Math.round(localOptions.titleSimilarityThreshold * 100)}%</span>
            </div>
            <div>
              <span className="font-medium">Author Threshold:</span>
              <span className="ml-2">{Math.round(localOptions.authorSimilarityThreshold * 100)}%</span>
            </div>
            <div>
              <span className="font-medium">Fuzzy Matching:</span>
              <span className="ml-2">{localOptions.enableFuzzyMatching ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div>
              <span className="font-medium">DOI Matching:</span>
              <span className="ml-2">{localOptions.strictDOIMatching ? 'Strict' : 'Lenient'}</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="font-medium">Merge Strategy:</span>
            <span className="ml-2 capitalize">{localOptions.mergeStrategy.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Performance Impact Warning */}
        {(localOptions.enableFuzzyMatching && 
          (localOptions.titleSimilarityThreshold < 0.7 || localOptions.authorSimilarityThreshold < 0.7)) && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <div className="font-medium">Performance Impact</div>
                <div>
                  Low similarity thresholds with fuzzy matching enabled may slow down duplicate 
                  detection for large result sets. Consider increasing thresholds if you experience 
                  performance issues.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}