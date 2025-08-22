/**
 * Bibliography Preview Component
 * UI component for displaying bibliography preview with statistics
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Badge } from './shadcn/badge';
import { Separator } from './shadcn/separator';
import { ScrollArea } from './shadcn/scroll-area';
import { Button } from './shadcn/button';
import { Copy, Eye, FileText, BarChart3 } from 'lucide-react';
import { CitationStyle, ReferenceType } from '../../lib/ai-types';
import { useBibliographyGenerator } from '../../hooks/useBibliographyGenerator';

export interface BibliographyPreviewProps {
  className?: string;
  maxPreviewLength?: number;
}

/**
 * BibliographyPreview component
 * Displays generated bibliography with statistics and preview
 */
export function BibliographyPreview({
  className = '',
  maxPreviewLength = 1000
}: BibliographyPreviewProps) {
  const {
    generatedBibliography,
    style,
    statistics,
    copyToClipboard,
    isGenerating
  } = useBibliographyGenerator();

  const [copySuccess, setCopySuccess] = React.useState(false);

  /**
   * Handle copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    const success = await copyToClipboard();
    setCopySuccess(success);

    if (success) {
      // Reset success message after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  /**
   * Get truncated preview text
   */
  const getPreviewText = () => {
    if (generatedBibliography.length <= maxPreviewLength) {
      return generatedBibliography;
    }

    const truncated = generatedBibliography.substring(0, maxPreviewLength);
    const lastNewlineIndex = truncated.lastIndexOf('\n');

    return lastNewlineIndex > 0
      ? truncated.substring(0, lastNewlineIndex)
      : truncated + '...';
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
   * Get reference type statistics
   */
  const getReferenceTypeStats = () => {
    const stats = statistics.referenceTypes;
    const entries = Object.entries(stats) as [ReferenceType, number][];

    return entries.map(([type, count]) => ({
      type,
      count,
      label: getReferenceTypeLabel(type),
      percentage: statistics.totalReferences > 0
        ? Math.round((count / statistics.totalReferences) * 100)
        : 0
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

  /**
   * Get publication year range
   */
  const getPublicationYearRange = () => {
    const years = Object.keys(statistics.publicationYears).map(Number).filter(year => !isNaN(year));
    if (years.length === 0) return null;

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return minYear === maxYear ? minYear.toString() : `${minYear} - ${maxYear}`;
  };

  // Don't render if no bibliography is generated and not generating
  if (generatedBibliography.length === 0 && !isGenerating) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Bibliography Preview
          </CardTitle>
          <CardDescription>
            Preview and statistics of your generated bibliography
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bibliography generated yet</p>
            <p className="text-sm mt-2">Use the controls above to generate one</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bibliography Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Bibliography Preview
          </CardTitle>
          <CardDescription>
            Generated in {getStyleDisplayName(style)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating bibliography...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {statistics.totalReferences} reference{statistics.totalReferences !== 1 ? 's' : ''}
                </Badge>
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>

              {copySuccess && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">
                  Bibliography copied to clipboard!
                </div>
              )}

              <ScrollArea className="h-96 w-full rounded-md border p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {getPreviewText()}
                </pre>
                {generatedBibliography.length > maxPreviewLength && (
                  <div className="text-center py-2 text-muted-foreground border-t">
                    <p className="text-xs">
                      Showing first {maxPreviewLength} characters
                      ({Math.round((maxPreviewLength / generatedBibliography.length) * 100)}% of total)
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bibliography Statistics */}
      {statistics.totalReferences > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bibliography Statistics
            </CardTitle>
            <CardDescription>
              Detailed analysis of your bibliography
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overview Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statistics.totalReferences}
                </div>
                <div className="text-sm text-muted-foreground">Total References</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(generatedBibliography.length / 100) / 10}KB
                </div>
                <div className="text-sm text-muted-foreground">Content Size</div>
              </div>
            </div>

            {statistics.duplicateReferences > 0 && (
              <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-lg font-semibold text-yellow-800">
                  {statistics.duplicateReferences}
                </div>
                <div className="text-sm text-yellow-700">Potential Duplicates Detected</div>
              </div>
            )}

            <Separator />

            {/* Reference Types Breakdown */}
            <div>
              <h4 className="font-medium mb-3">Reference Types</h4>
              <div className="space-y-2">
                {getReferenceTypeStats().map(({ type, count, label, percentage }) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </div>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publication Timeline */}
            {Object.keys(statistics.publicationYears).length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Publication Timeline</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Year Range</div>
                      <div className="font-medium">{getPublicationYearRange()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg. Authors</div>
                      <div className="font-medium">
                        {statistics.averageAuthorsPerReference.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statistics.publicationYears)
                      .sort(([a], [b]) => parseInt(b) - parseInt(a))
                      .map(([year, count]) => (
                        <Badge key={year} variant="secondary" className="text-xs">
                          {year}: {count}
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Quality Indicators */}
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Quality Indicators</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uniqueness:</span>
                  <span className="font-medium">
                    {statistics.totalReferences > 0
                      ? Math.round((statistics.uniqueReferences / statistics.totalReferences) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completeness:</span>
                  <span className="font-medium">
                    {statistics.totalReferences > 0 ? 'High' : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BibliographyPreview;
