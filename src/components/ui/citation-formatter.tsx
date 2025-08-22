"use client"

import React, { useState, useEffect } from 'react';
import { Button } from './shadcn/button';
import { Label } from './shadcn/label';
import { Card, CardContent, CardHeader, CardTitle } from './shadcn/card';
import { Badge } from './shadcn/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './shadcn/select';
import { Alert, AlertDescription } from './shadcn/alert';
import { CitationStyle, Reference, ReferenceType } from '../../lib/ai-types';
import { CitationStyleEngine } from '../../worker/lib/citation-style-engine';
import {
  BookOpen,
  FileText,
  Globe,
  Quote,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';

interface CitationFormatterProps {
  references?: Reference[];
  onFormattedCitations?: (citations: { inline: string; bibliography: string }) => void;
}

interface FormattingResult {
  inline: string;
  bibliography: string;
  validation: {
    isValid: boolean;
    errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
    warnings: Array<{ field: string; message: string; severity: 'error' | 'warning' }>;
    missingFields: string[];
  };
}

export const CitationFormatter: React.FC<CitationFormatterProps> = ({
  references = [],
  onFormattedCitations
}) => {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>(CitationStyle.APA);
  const [selectedReferences, setSelectedReferences] = useState<Reference[]>([]);
  const [formattingResults, setFormattingResults] = useState<Map<string, FormattingResult>>(new Map());
  const [bibliography, setBibliography] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'alphabetical' | 'chronological' | 'appearance'>('alphabetical');
  const [loading, setLoading] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'citations' | 'bibliography'>('citations');

  // Available citation styles
  const citationStyles = [
    { value: CitationStyle.APA, label: 'APA (7th Edition)', description: 'American Psychological Association' },
    { value: CitationStyle.MLA, label: 'MLA (9th Edition)', description: 'Modern Language Association' },
    { value: CitationStyle.CHICAGO, label: 'Chicago (17th Edition)', description: 'Chicago Manual of Style' },
    { value: CitationStyle.HARVARD, label: 'Harvard', description: 'Harvard Referencing Style' }
  ];

  // Reference types with icons
  const referenceTypeIcons = {
    [ReferenceType.JOURNAL_ARTICLE]: <FileText className="h-4 w-4" />,
    [ReferenceType.BOOK]: <BookOpen className="h-4 w-4" />,
    [ReferenceType.BOOK_CHAPTER]: <BookOpen className="h-4 w-4" />,
    [ReferenceType.WEBSITE]: <Globe className="h-4 w-4" />,
    [ReferenceType.CONFERENCE_PAPER]: <FileText className="h-4 w-4" />,
    [ReferenceType.THESIS]: <FileText className="h-4 w-4" />,
    [ReferenceType.REPORT]: <FileText className="h-4 w-4" />
  };

  // Format individual citations
  const formatCitations = async () => {
    if (selectedReferences.length === 0) return;

    setLoading(true);
    const results = new Map<string, FormattingResult>();

    for (const reference of selectedReferences) {
      try {
        const inline = CitationStyleEngine.formatInlineCitation(reference, selectedStyle);
        const bibliography = CitationStyleEngine.formatBibliographyEntry(reference, selectedStyle);
        const validation = CitationStyleEngine.validateStyleRequirements(reference, selectedStyle);

        results.set(reference.id, {
          inline,
          bibliography,
          validation: {
            isValid: validation.isValid,
            errors: validation.errors.map((error: string) => ({ field: 'general', message: error, severity: 'error' as const })),
            warnings: validation.warnings.map((warning: string) => ({ field: 'general', message: warning, severity: 'warning' as const })),
            missingFields: []
          }
        });
      } catch (error) {
        console.error(`Error formatting reference ${reference.id}:`, error);
        results.set(reference.id, {
          inline: 'Error formatting citation',
          bibliography: 'Error formatting bibliography entry',
          validation: {
            isValid: false,
            errors: [{ field: 'formatting', message: 'Failed to format citation', severity: 'error' }],
            warnings: [],
            missingFields: []
          }
        });
      }
    }

    setFormattingResults(results);

    // Call callback if provided
    if (onFormattedCitations) {
      const allInline = Array.from(results.values()).map(r => r.inline).join('; ');
      const allBibliography = Array.from(results.values()).map(r => r.bibliography).join('\n\n');
      onFormattedCitations({ inline: allInline, bibliography: allBibliography });
    }

    setLoading(false);
  };

  // Generate bibliography
  const generateBibliography = () => {
    if (selectedReferences.length === 0) return;

    setLoading(true);
    try {
      const generated = CitationStyleEngine.generateBibliography(
        selectedReferences,
        selectedStyle,
        sortOrder
      );
      setBibliography(generated);
    } catch (error) {
      console.error('Error generating bibliography:', error);
      setBibliography('Error generating bibliography');
    }
    setLoading(false);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(id);
      setTimeout(() => setCopiedToClipboard(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Toggle reference selection
  const toggleReferenceSelection = (reference: Reference) => {
    setSelectedReferences(prev => {
      const isSelected = prev.find(r => r.id === reference.id);
      if (isSelected) {
        return prev.filter(r => r.id !== reference.id);
      } else {
        return [...prev, reference];
      }
    });
  };

  // Select all references
  const selectAllReferences = () => {
    setSelectedReferences(references);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedReferences([]);
    setFormattingResults(new Map());
    setBibliography('');
  };

  // Get validation icon
  const getValidationIcon = (validation: FormattingResult['validation']) => {
    if (!validation.isValid) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (validation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // Get validation color
  const getValidationColor = (validation: FormattingResult['validation']) => {
    if (!validation.isValid) return 'border-red-200 bg-red-50';
    if (validation.warnings.length > 0) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  // Auto-format when selection or style changes
  useEffect(() => {
    if (selectedReferences.length > 0) {
      formatCitations();
    }
  }, [selectedReferences, selectedStyle]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Quote className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Citation & Bibliography Formatter</h3>
      </div>

      {/* Style Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Citation Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="citation-style">Select Citation Style</Label>
              <Select
                value={selectedStyle}
                onValueChange={(value) => setSelectedStyle(value as CitationStyle)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose citation style" />
                </SelectTrigger>
                <SelectContent>
                  {citationStyles.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{style.label}</span>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reference Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Select References</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllReferences}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {references.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No references available</p>
              <p className="text-sm">Add references to your conversation first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {references.map(reference => (
                <div
                  key={reference.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedReferences.find(r => r.id === reference.id)
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleReferenceSelection(reference)}
                >
                  <div className="flex-shrink-0">
                    {referenceTypeIcons[reference.type as keyof typeof referenceTypeIcons] || <FileText className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{reference.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {reference.authors.length > 0
                        ? reference.authors.join(', ')
                        : 'No author'
                      }
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {reference.type.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {selectedReferences.length > 0 && (
        <div className="space-y-4">
          {/* Simple Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'citations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('citations')}
            >
              Individual Citations
            </button>
            <button
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'bibliography'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('bibliography')}
            >
              Bibliography
            </button>
          </div>

          {/* Citations Tab */}
          {activeTab === 'citations' && (
            <div className="space-y-4">
              {Array.from(formattingResults.entries()).map(([referenceId, result]) => {
                const reference = selectedReferences.find(r => r.id === referenceId);
                if (!reference) return null;

                return (
                  <Card key={referenceId} className={getValidationColor(result.validation)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">{reference.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getValidationIcon(result.validation)}
                            <span className="text-xs text-muted-foreground">
                              {result.validation.isValid ? 'Valid' : 'Invalid'}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.inline, `${referenceId}-inline`)}
                          className="flex-shrink-0"
                        >
                          {copiedToClipboard === `${referenceId}-inline` ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Inline Citation */}
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Inline Citation</Label>
                        <div className="mt-1 p-2 bg-white border rounded text-sm font-mono">
                          {result.inline}
                        </div>
                      </div>

                      {/* Bibliography Entry */}
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Bibliography Entry</Label>
                        <div className="mt-1 p-2 bg-white border rounded text-sm">
                          {result.bibliography}
                        </div>
                      </div>

                      {/* Validation Messages */}
                      {result.validation.errors.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Errors:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {result.validation.errors.map((error: { message: string }, index: number) => (
                                <li key={index}>{error.message}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {result.validation.warnings.length > 0 && (
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>Warnings:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {result.validation.warnings.map((warning: { message: string }, index: number) => (
                                <li key={index}>{warning.message}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Bibliography Tab */}
          {activeTab === 'bibliography' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Bibliography</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sortOrder}
                      onValueChange={(value) => setSortOrder(value as typeof sortOrder)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                        <SelectItem value="chronological">Chronological</SelectItem>
                        <SelectItem value="appearance">Order of Appearance</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={generateBibliography}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bibliography ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {selectedReferences.length} references • {selectedStyle} style
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(bibliography, 'bibliography')}
                      >
                        {copiedToClipboard === 'bibliography' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-4 bg-white border rounded font-serif text-sm leading-relaxed whitespace-pre-line">
                      {bibliography}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bibliography generated</p>
                    <p className="text-sm">Select references and click "Generate" to create a bibliography</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Formatting citations...</span>
          </div>
        </div>
      )}

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Citations are automatically formatted when you select references or change the citation style.
          Copy individual citations or generate a complete bibliography for your document.
        </AlertDescription>
      </Alert>
    </div>
  );
};
