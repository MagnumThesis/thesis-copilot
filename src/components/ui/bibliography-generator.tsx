/**
 * Bibliography Generator Main Component
 * Main component that integrates all bibliography generation functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Button } from './shadcn/button';
import { Alert, AlertDescription } from './shadcn/alert';
import { Separator } from './shadcn/separator';
import { Badge } from './shadcn/badge';
import { BookOpen, Settings, Download, Eye, AlertTriangle, CheckCircle } from 'lucide-react';
import { Reference, CitationStyle } from '../../lib/ai-types';
import { useBibliographyGenerator } from '../../hooks/useBibliographyGenerator';
import { BibliographyControls } from './bibliography-controls';
import { ExportOptionsComponent } from './export-options';
import { BibliographyPreview } from './bibliography-preview';

export interface BibliographyGeneratorProps {
  references?: Reference[];
  initialStyle?: CitationStyle;
  className?: string;
  onBibliographyGenerated?: (bibliography: string) => void;
  onError?: (error: string) => void;
}

/**
 * BibliographyGenerator component
 * Main component that provides complete bibliography generation functionality
 */
export function BibliographyGenerator({
  references = [],
  initialStyle = CitationStyle.APA,
  className = '',
  onBibliographyGenerated,
  onError
}: BibliographyGeneratorProps) {
  const {
    references: bibReferences,
    setReferences,
    generatedBibliography,
    error,
    clearError,
    isGenerating
  } = useBibliographyGenerator(references, initialStyle);

  const [activeView, setActiveView] = useState<'controls' | 'preview' | 'export' | 'help'>('controls');

  /**
   * Update references when props change
   */
  useEffect(() => {
    if (references.length > 0) {
      setReferences(references);
    }
  }, [references, setReferences]);

  /**
   * Handle bibliography generation completion
   */
  useEffect(() => {
    if (generatedBibliography && generatedBibliography.length > 0) {
      onBibliographyGenerated?.(generatedBibliography);
      // Switch to preview view when bibliography is generated
      setActiveView('preview');
    }
  }, [generatedBibliography, onBibliographyGenerated]);

  /**
   * Handle errors
   */
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  /**
   * Get status information
   */
  const getStatusInfo = () => {
    if (isGenerating) {
      return {
        type: 'loading' as const,
        message: 'Generating bibliography...',
        icon: <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
      };
    }

    if (error) {
      return {
        type: 'error' as const,
        message: error,
        icon: <AlertTriangle className="h-4 w-4" />
      };
    }

    if (generatedBibliography) {
      return {
        type: 'success' as const,
        message: `Bibliography generated successfully (${bibReferences.length} references)`,
        icon: <CheckCircle className="h-4 w-4" />
      };
    }

    return {
      type: 'info' as const,
      message: `${bibReferences.length} reference${bibReferences.length !== 1 ? 's' : ''} loaded`,
      icon: <BookOpen className="h-4 w-4" />
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Bibliography Generator
          </CardTitle>
          <CardDescription>
            Generate professional bibliographies in multiple citation styles with export options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Status Information */}
          <div className={`flex items-center gap-2 p-3 rounded-lg border ${
            statusInfo.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : statusInfo.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : statusInfo.type === 'loading'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-muted border-muted-foreground/20'
          }`}>
            {statusInfo.icon}
            <span className="text-sm font-medium">{statusInfo.message}</span>
            {error && (
              <Button
                onClick={clearError}
                variant="ghost"
                size="sm"
                className="ml-auto text-red-800 hover:text-red-900"
              >
                Dismiss
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          {bibReferences.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {bibReferences.length} References
                  </Badge>
                </div>
                {generatedBibliography && (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(generatedBibliography.length / 100) / 10}KB Generated
                    </Badge>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeView === 'controls' ? 'default' : 'outline'}
              onClick={() => setActiveView('controls')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Controls
            </Button>
            <Button
              variant={activeView === 'preview' ? 'default' : 'outline'}
              onClick={() => setActiveView('preview')}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant={activeView === 'export' ? 'default' : 'outline'}
              onClick={() => setActiveView('export')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant={activeView === 'help' ? 'default' : 'outline'}
              onClick={() => setActiveView('help')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Help
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Controls View */}
        {activeView === 'controls' && <BibliographyControls />}

        {/* Preview View */}
        {activeView === 'preview' && <BibliographyPreview />}

        {/* Export View */}
        {activeView === 'export' && <ExportOptionsComponent />}

        {/* Help View */}
        {activeView === 'help' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use Bibliography Generator</CardTitle>
              <CardDescription>
                Step-by-step guide to generating professional bibliographies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-2">1. Add References</h4>
                  <p className="text-sm text-muted-foreground">
                    Start by adding references to your bibliography. You can add them manually or import from various sources.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">2. Choose Citation Style</h4>
                  <p className="text-sm text-muted-foreground">
                    Select from 6 supported citation styles: APA, MLA, Chicago, Harvard, IEEE, and Vancouver.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">3. Set Sorting Options</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose how to sort your bibliography: alphabetical, chronological, or by order of appearance.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">4. Generate Bibliography</h4>
                  <p className="text-sm text-muted-foreground">
                    Click "Generate Bibliography" to create your formatted bibliography with statistics.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">5. Export or Copy</h4>
                  <p className="text-sm text-muted-foreground">
                    Export to BibTeX, RIS, EndNote, Zotero, or plain text formats, or copy directly to clipboard.
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm mb-2">Supported Export Formats</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">BibTeX (.bib)</Badge>
                    <span className="text-muted-foreground">LaTeX & databases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">RIS (.ris)</Badge>
                    <span className="text-muted-foreground">Reference managers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">EndNote (.enw)</Badge>
                    <span className="text-muted-foreground">EndNote software</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Zotero (.rdf)</Badge>
                    <span className="text-muted-foreground">Zotero browser</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>6 citation styles with accurate formatting</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Multiple sorting options</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Detailed statistics and analysis</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Duplicate reference detection</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Export to multiple formats</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Copy to clipboard functionality</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default BibliographyGenerator;
