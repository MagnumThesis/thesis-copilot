/**
 * Citation Formatter Component
 * Main component for formatting citations with style selection and preview
 */

import React, { useState, useEffect } from 'react';
import { Reference } from '../../lib/ai-types.js';
import { useCitationFormatter } from '../../hooks/useCitationFormatter.js';
import { StyleSelector } from './style-selector.js';
import { CitationPreview } from './citation-preview.js';
import { CitationValidationDisplay } from './citation-validation-display.js';
import { Button } from './shadcn/button.js';
import { Separator } from './shadcn/separator.js';
import { Badge } from './shadcn/badge.js';
import { AlertTriangle, RotateCcw, CheckCircle, Settings } from 'lucide-react';

export interface CitationFormatterProps {
  reference?: Reference | null;
  onReferenceChange?: (reference: Reference | null) => void;
  className?: string;
  compact?: boolean;
  showValidation?: boolean;
  autoFormat?: boolean;
  onCitationInsert?: (citation: string) => Promise<boolean>;
  onBibliographyInsert?: (bibliography: string) => Promise<boolean>;
}

export const CitationFormatter: React.FC<CitationFormatterProps> = ({
  reference = null,
  className = '',
  compact = false,
  showValidation = true,
  autoFormat = true,
  onCitationInsert,
  onBibliographyInsert
}) => {
  // Citation formatter hook
  const {
    selectedStyle,
    selectedReference,
    inlineCitation,
    bibliographyEntry,
    validationResult,
    isProcessing,
    error,
    citationHistory,
    setSelectedStyle,
    setSelectedReference,
    copyToClipboard,
    clearError
  } = useCitationFormatter({
    autoFormat,
    maxHistoryItems: 20
  });

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [lastInserted, setLastInserted] = useState<string | null>(null);

  // Sync with external reference prop
  useEffect(() => {
    if (reference !== selectedReference) {
      setSelectedReference(reference);
    }
  }, [reference, setSelectedReference]);



  // Handle citation insertion
  const handleCitationInsert = async (citation: string): Promise<boolean> => {
    if (onCitationInsert) {
      const success = await onCitationInsert(citation);
      if (success) {
        setLastInserted('citation');
        setTimeout(() => setLastInserted(null), 3000);
      }
      return success;
    }
    // Fallback to clipboard
    return await copyToClipboard(citation);
  };

  // Handle bibliography insertion
  const handleBibliographyInsert = async (bibliography: string): Promise<boolean> => {
    if (onBibliographyInsert) {
      const success = await onBibliographyInsert(bibliography);
      if (success) {
        setLastInserted('bibliography');
        setTimeout(() => setLastInserted(null), 3000);
      }
      return success;
    }
    // Fallback to clipboard
    return await copyToClipboard(bibliography);
  };

  const renderHeader = () => {
    if (compact) {
      return (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Citation Formatter</h3>
            {isProcessing && <RotateCcw className="h-3 w-3 animate-spin" />}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-6 w-6 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Citation Formatter</h2>
            {lastInserted && (
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {lastInserted === 'citation' ? 'Citation inserted' : 'Bibliography inserted'}
              </Badge>
            )}
            {isProcessing && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <RotateCcw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>

        {selectedReference && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Reference:</span>
            <Badge variant="outline" className="text-xs">
              {selectedReference.title.length > 40
                ? `${selectedReference.title.substring(0, 37)}...`
                : selectedReference.title
              }
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Citation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StyleSelector
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            showDescription={!compact}
            compact={compact}
          />
        </CardContent>
      </Card>
    );
  };

  const renderMainContent = () => {
    return (
      <div className="space-y-4">
        {/* Citation Preview */}
        <CitationPreview
          inlineCitation={inlineCitation}
          bibliographyEntry={bibliographyEntry}
          isProcessing={isProcessing}
          error={error}
          onCopyInline={copyToClipboard}
          onCopyBibliography={copyToClipboard}
          onInsertInline={handleCitationInsert}
          onInsertBibliography={handleBibliographyInsert}
          compact={compact}
        />

        {/* Validation Display */}
        {showValidation && validationResult && (
          <>
            <Separator />
            <CitationValidationDisplay
              validationResult={validationResult}
              compact={compact}
            />
          </>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="ml-auto h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderEmptyState = () => {
    if (selectedReference) return null;

    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Settings className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">No Reference Selected</h3>
              <p className="text-xs text-muted-foreground">
                Select a reference to start formatting citations.
              </p>
            </div>
            {citationHistory.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Recent citations: {citationHistory.length}
                </p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {citationHistory.slice(0, 3).map((item, index) => (
                    <Badge key={item.id} variant="secondary" className="text-xs">
                      {item.citationStyle.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      {renderHeader()}

      {/* Settings Panel */}
      {renderSettings()}

      {/* Main Content or Empty State */}
      {selectedReference ? renderMainContent() : renderEmptyState()}
    </div>
  );
};

export default CitationFormatter;
