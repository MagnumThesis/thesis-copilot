/**
 * Bibliography Controls Component
 * UI component for bibliography sorting and formatting options
 */

import React from 'react';
import { Button } from './shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './shadcn/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Badge } from './shadcn/badge';
import { Separator } from './shadcn/separator';
import { CitationStyle, ReferenceType } from '../../lib/ai-types';
import { useBibliographyGenerator } from '../../hooks/useBibliographyGenerator';

export interface BibliographyControlsProps {
  className?: string;
}

/**
 * BibliographyControls component
 * Provides UI controls for bibliography generation settings
 */
export function BibliographyControls({ className = '' }: BibliographyControlsProps) {
  const {
    style,
    sortOrder,
    setStyle,
    setSortOrder,
    generateBibliography,
    isGenerating,
    statistics
  } = useBibliographyGenerator();

  /**
   * Handle style change
   */
  const handleStyleChange = (newStyle: CitationStyle) => {
    setStyle(newStyle);
  };

  /**
   * Handle sort order change
   */
  const handleSortOrderChange = (newSortOrder: 'alphabetical' | 'chronological' | 'appearance') => {
    setSortOrder(newSortOrder);
  };

  /**
   * Get style display name
   */
  const getStyleDisplayName = (style: CitationStyle): string => {
    switch (style) {
      case CitationStyle.APA:
        return 'APA (7th Edition)';
      case CitationStyle.MLA:
        return 'MLA (9th Edition)';
      case CitationStyle.CHICAGO:
        return 'Chicago (17th Edition)';
      case CitationStyle.HARVARD:
        return 'Harvard';
      case CitationStyle.IEEE:
        return 'IEEE';
      case CitationStyle.VANCOUVER:
        return 'Vancouver';
      default:
        return (style as string).toUpperCase();
    }
  };

  /**
   * Get sort order display name
   */
  const getSortOrderDisplayName = (sortOrder: string): string => {
    switch (sortOrder) {
      case 'alphabetical':
        return 'Alphabetical (A-Z)';
      case 'chronological':
        return 'Chronological (Newest First)';
      case 'appearance':
        return 'Order of Appearance';
      default:
        return sortOrder;
    }
  };

  /**
   * Get reference type statistics
   */
  const getReferenceTypeStats = () => {
    const stats = statistics.referenceTypes;
    const entries = Object.entries(stats) as [ReferenceType, number][];

    return entries.map(([type, count]) => ({
      type,
      count,
      label: getReferenceTypeLabel(type)
    }));
  };

  /**
   * Get reference type label
   */
  const getReferenceTypeLabel = (type: ReferenceType): string => {
    switch (type) {
      case ReferenceType.JOURNAL_ARTICLE:
        return 'Journal Articles';
      case ReferenceType.BOOK:
        return 'Books';
      case ReferenceType.BOOK_CHAPTER:
        return 'Book Chapters';
      case ReferenceType.CONFERENCE_PAPER:
        return 'Conference Papers';
      case ReferenceType.THESIS:
        return 'Theses';
      case ReferenceType.WEBSITE:
        return 'Websites';
      case ReferenceType.REPORT:
        return 'Reports';
      case ReferenceType.PATENT:
        return 'Patents';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Citation Style Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Citation Style</CardTitle>
          <CardDescription>
            Choose the citation style for your bibliography
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={style} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select citation style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CitationStyle.APA}>
                {getStyleDisplayName(CitationStyle.APA)}
              </SelectItem>
              <SelectItem value={CitationStyle.MLA}>
                {getStyleDisplayName(CitationStyle.MLA)}
              </SelectItem>
              <SelectItem value={CitationStyle.CHICAGO}>
                {getStyleDisplayName(CitationStyle.CHICAGO)}
              </SelectItem>
              <SelectItem value={CitationStyle.HARVARD}>
                {getStyleDisplayName(CitationStyle.HARVARD)}
              </SelectItem>
              <SelectItem value={CitationStyle.IEEE}>
                {getStyleDisplayName(CitationStyle.IEEE)}
              </SelectItem>
              <SelectItem value={CitationStyle.VANCOUVER}>
                {getStyleDisplayName(CitationStyle.VANCOUVER)}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sorting Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sorting Options</CardTitle>
          <CardDescription>
            Choose how to sort your bibliography entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sorting order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alphabetical">
                {getSortOrderDisplayName('alphabetical')}
              </SelectItem>
              <SelectItem value="chronological">
                {getSortOrderDisplayName('chronological')}
              </SelectItem>
              <SelectItem value="appearance">
                {getSortOrderDisplayName('appearance')}
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={generateBibliography}
            disabled={isGenerating || statistics.totalReferences === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? 'Generating Bibliography...' : 'Generate Bibliography'}
          </Button>
          {statistics.totalReferences === 0 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Add references to enable bibliography generation
            </p>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics.totalReferences > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reference Statistics</CardTitle>
            <CardDescription>
              Summary of your reference collection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statistics.totalReferences}
                </div>
                <div className="text-sm text-muted-foreground">Total References</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statistics.uniqueReferences}
                </div>
                <div className="text-sm text-muted-foreground">Unique References</div>
              </div>
            </div>

            {statistics.duplicateReferences > 0 && (
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-lg font-semibold text-yellow-800">
                  {statistics.duplicateReferences}
                </div>
                <div className="text-sm text-yellow-700">Potential Duplicates</div>
              </div>
            )}

            <Separator />

            {/* Reference Types */}
            <div>
              <h4 className="font-medium mb-2">Reference Types</h4>
              <div className="flex flex-wrap gap-2">
                {getReferenceTypeStats().map(({ type, count, label }) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {label}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Publication Years */}
            {Object.keys(statistics.publicationYears).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Publication Years</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statistics.publicationYears)
                      .sort(([a], [b]) => parseInt(b) - parseInt(a))
                      .map(([year, count]) => (
                        <Badge key={year} variant="outline" className="text-xs">
                          {year}: {count}
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Average Authors */}
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">
                {statistics.averageAuthorsPerReference.toFixed(1)}
              </div>
              <div className="text-sm text-blue-700">Average Authors per Reference</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BibliographyControls;
