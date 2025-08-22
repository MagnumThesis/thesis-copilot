/**
 * Export Options Component
 * UI component for bibliography export functionality
 */

import React, { useState } from 'react';
import { Button } from './shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './shadcn/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Checkbox } from './shadcn/checkbox';
import { Badge } from './shadcn/badge';
import { Separator } from './shadcn/separator';
import { Download, Copy, FileText, Settings, CheckCircle } from 'lucide-react';
import { ExportFormat, ExportOptions } from '../../utils/export-formatters';
import { useBibliographyGenerator } from '../../hooks/useBibliographyGenerator';

export interface ExportOptionsProps {
  className?: string;
}

/**
 * ExportOptions component
 * Provides UI for exporting bibliographies in different formats
 */
export function ExportOptionsComponent({ className = '' }: ExportOptionsProps) {
  const {
    generatedBibliography,
    downloadBibliography,
    copyToClipboard
  } = useBibliographyGenerator();

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.PLAIN_TEXT);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeUrls: true,
    includeDOIs: true,
    includeAbstracts: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Handle format change
   */
  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format);
  };

  /**
   * Handle export option change
   */
  const handleOptionChange = (option: keyof ExportOptions, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  /**
   * Handle download
   */
  const handleDownload = async () => {
    if (generatedBibliography.length === 0) return;

    setIsExporting(true);
    try {
      await downloadBibliography(selectedFormat, exportOptions);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    if (generatedBibliography.length === 0) return;

    const success = await copyToClipboard();
    setCopySuccess(success);

    if (success) {
      // Reset success message after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  /**
   * Get format display name
   */
  const getFormatDisplayName = (format: ExportFormat): string => {
    switch (format) {
      case ExportFormat.BIBTEX:
        return 'BibTeX (.bib)';
      case ExportFormat.RIS:
        return 'RIS (.ris)';
      case ExportFormat.ENDNOTE:
        return 'EndNote (.enw)';
      case ExportFormat.ZOTERO:
        return 'Zotero RDF (.rdf)';
      case ExportFormat.PLAIN_TEXT:
        return 'Plain Text (.txt)';
      default:
        return (format as string).toUpperCase();
    }
  };

  /**
   * Get format description
   */
  const getFormatDescription = (format: ExportFormat): string => {
    switch (format) {
      case ExportFormat.BIBTEX:
        return 'Standard format for LaTeX and academic databases';
      case ExportFormat.RIS:
        return 'Research Information Systems format for reference managers';
      case ExportFormat.ENDNOTE:
        return 'Popular reference management software format';
      case ExportFormat.ZOTERO:
        return 'Open-source reference manager format (RDF)';
      case ExportFormat.PLAIN_TEXT:
        return 'Simple text format for basic use';
      default:
        return 'Export format';
    }
  };

  /**
   * Get format icon
   */
  const getFormatIcon = () => {
    return <FileText className="h-4 w-4" />;
  };

  // Don't render if no bibliography is generated
  if (generatedBibliography.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Export Bibliography</CardTitle>
          <CardDescription>
            Generate a bibliography first to enable export options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No bibliography generated yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Export Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Format</CardTitle>
          <CardDescription>
            Choose the format for your bibliography export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedFormat} onValueChange={handleFormatChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select export format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ExportFormat.PLAIN_TEXT}>
                <div className="flex items-center gap-2">
                  {getFormatIcon()}
                  <div>
                    <div className="font-medium">{getFormatDisplayName(ExportFormat.PLAIN_TEXT)}</div>
                    <div className="text-xs text-muted-foreground">{getFormatDescription(ExportFormat.PLAIN_TEXT)}</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.BIBTEX}>
                <div className="flex items-center gap-2">
                  {getFormatIcon()}
                  <div>
                    <div className="font-medium">{getFormatDisplayName(ExportFormat.BIBTEX)}</div>
                    <div className="text-xs text-muted-foreground">{getFormatDescription(ExportFormat.BIBTEX)}</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.RIS}>
                <div className="flex items-center gap-2">
                  {getFormatIcon()}
                  <div>
                    <div className="font-medium">{getFormatDisplayName(ExportFormat.RIS)}</div>
                    <div className="text-xs text-muted-foreground">{getFormatDescription(ExportFormat.RIS)}</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.ENDNOTE}>
                <div className="flex items-center gap-2">
                  {getFormatIcon()}
                  <div>
                    <div className="font-medium">{getFormatDisplayName(ExportFormat.ENDNOTE)}</div>
                    <div className="text-xs text-muted-foreground">{getFormatDescription(ExportFormat.ENDNOTE)}</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value={ExportFormat.ZOTERO}>
                <div className="flex items-center gap-2">
                  {getFormatIcon()}
                  <div>
                    <div className="font-medium">{getFormatDisplayName(ExportFormat.ZOTERO)}</div>
                    <div className="text-xs text-muted-foreground">{getFormatDescription(ExportFormat.ZOTERO)}</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Options
          </CardTitle>
          <CardDescription>
            Customize what information to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeUrls"
              checked={exportOptions.includeUrls || false}
              onCheckedChange={(checked) => handleOptionChange('includeUrls', checked as boolean)}
            />
            <label
              htmlFor="includeUrls"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include URLs
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeDOIs"
              checked={exportOptions.includeDOIs || false}
              onCheckedChange={(checked) => handleOptionChange('includeDOIs', checked as boolean)}
            />
            <label
              htmlFor="includeDOIs"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include DOIs
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAbstracts"
              checked={exportOptions.includeAbstracts || false}
              onCheckedChange={(checked) => handleOptionChange('includeAbstracts', checked as boolean)}
            />
            <label
              htmlFor="includeAbstracts"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include Abstracts
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Actions</CardTitle>
          <CardDescription>
            Download or copy your bibliography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Downloading...' : `Download ${getFormatDisplayName(selectedFormat)}`}
          </Button>

          <Separator />

          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy to Clipboard
          </Button>

          {copySuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Bibliography copied to clipboard!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Selected Format</div>
              <Badge variant="secondary" className="mt-1">
                {getFormatDisplayName(selectedFormat)}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Options</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {exportOptions.includeUrls && (
                  <Badge variant="outline" className="text-xs">URLs</Badge>
                )}
                {exportOptions.includeDOIs && (
                  <Badge variant="outline" className="text-xs">DOIs</Badge>
                )}
                {exportOptions.includeAbstracts && (
                  <Badge variant="outline" className="text-xs">Abstracts</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Export Tips:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>BibTeX format is ideal for LaTeX documents</li>
              <li>RIS format works with most reference managers</li>
              <li>Include DOIs for better academic discoverability</li>
              <li>URLs are useful for web sources and recent publications</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExportOptionsComponent;
