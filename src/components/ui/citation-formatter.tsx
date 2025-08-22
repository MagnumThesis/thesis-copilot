"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Button } from './shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './shadcn/select';
import { Badge } from './shadcn/badge';
import { Separator } from './shadcn/separator';
import { CitationStyle, Reference } from '../../lib/ai-types';
import { Copy, Check, AlertCircle, Info } from 'lucide-react';

interface CitationFormatterProps {
  reference?: Reference;
  conversationId: string;
  onStyleChange?: (style: CitationStyle) => void;
}

// Simplified frontend citation formatter
class SimpleCitationFormatter {
  static formatInlineCitation(reference: Reference, style: CitationStyle): string {
    if (!reference.authors.length) {
      return `("${reference.title.substring(0, 30)}...")`;
    }

    const firstAuthor = reference.authors[0];
    const authorName = this.parseAuthorName(firstAuthor);
    const year = reference.publication_date || 'n.d.';

    switch (style) {
      case CitationStyle.APA:
        return `(${authorName}, ${year})`;
      case CitationStyle.MLA:
        return `(${authorName})`;
      case CitationStyle.CHICAGO:
        return `(${authorName} ${year})`;
      case CitationStyle.HARVARD:
        return `(${authorName} ${year})`;
      default:
        return `(${authorName}, ${year})`;
    }
  }

  static parseAuthorName(authorString: string): string {
    // Simple parsing: assume "Last, First" or "First Last" format
    if (authorString.includes(',')) {
      const parts = authorString.split(',').map(p => p.trim());
      return `${parts[0]} ${parts[1]?.charAt(0) || ''}.`;
    } else {
      const parts = authorString.split(' ');
      if (parts.length >= 2) {
        return `${parts[parts.length - 1]} ${parts[0].charAt(0)}.`;
      }
      return authorString;
    }
  }

  static formatBibliographyEntry(reference: Reference, style: CitationStyle): string {
    const authors = reference.authors.map(author =>
      this.parseAuthorName(author)
    ).join(', ');

    const year = reference.publication_date || 'n.d.';
    const title = reference.title;

    switch (style) {
      case CitationStyle.APA:
        return `${authors} (${year}). ${title}. ${reference.journal || ''}.`;

      case CitationStyle.MLA:
        return `${authors}. "${title}." ${reference.journal || ''}, ${year}.`;

      case CitationStyle.CHICAGO:
        return `${authors}. "${title}." ${reference.journal || ''} ${year}.`;

      case CitationStyle.HARVARD:
        return `${authors} ${year}, '${title}', ${reference.journal || ''}.`;

      default:
        return `${authors} (${year}). ${title}.`;
    }
  }

  static validateReference(reference: Reference): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!reference.title?.trim()) {
      errors.push('Title is required');
    }

    if (!reference.authors.length) {
      warnings.push('Author information is recommended');
    }

    if (!reference.publication_date) {
      warnings.push('Publication date is recommended');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

interface CitationResult {
  inline: string;
  bibliography: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const CitationFormatter: React.FC<CitationFormatterProps> = ({
  reference,
  conversationId,
  onStyleChange
}) => {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>(CitationStyle.APA);
  const [citationResults, setCitationResults] = useState<Record<CitationStyle, CitationResult>>({} as Record<CitationStyle, CitationResult>);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const [copiedBibliography, setCopiedBibliography] = useState<string | null>(null);

  // Generate citations when reference or style changes
  useEffect(() => {
    if (reference) {
      generateAllCitations(reference);
    }
  }, [reference]);

  // Notify parent when style changes
  useEffect(() => {
    if (onStyleChange) {
      onStyleChange(selectedStyle);
    }
  }, [selectedStyle, onStyleChange]);

  const generateAllCitations = (ref: Reference) => {
    const styles = Object.values(CitationStyle);
    const results: Record<CitationStyle, CitationResult> = {} as Record<CitationStyle, CitationResult>;

    styles.forEach(style => {
      try {
        const inlineCitation = SimpleCitationFormatter.formatInlineCitation(ref, style);
        const bibliographyEntry = SimpleCitationFormatter.formatBibliographyEntry(ref, style);
        const validation = SimpleCitationFormatter.validateReference(ref);

        results[style] = {
          inline: inlineCitation,
          bibliography: bibliographyEntry,
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings
        };
      } catch (error) {
        results[style] = {
          inline: '',
          bibliography: '',
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: []
        };
      }
    });

    setCitationResults(results);
  };

  const handleStyleChange = (style: CitationStyle) => {
    setSelectedStyle(style);
  };

  const copyToClipboard = async (text: string, type: 'citation' | 'bibliography') => {
    try {
      await navigator.clipboard.writeText(text);

      if (type === 'citation') {
        setCopiedCitation(text);
        setTimeout(() => setCopiedCitation(null), 2000);
      } else {
        setCopiedBibliography(text);
        setTimeout(() => setCopiedBibliography(null), 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const renderCitationCard = (style: CitationStyle) => {
    const result = citationResults[style];
    if (!result) return null;

    const isSelected = style === selectedStyle;

    return (
      <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{style.toUpperCase()}</CardTitle>
            <div className="flex items-center gap-2">
              {result.isValid ? (
                <Badge variant="secondary" className="text-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Issues
                </Badge>
              )}
              {isSelected && (
                <Badge variant="default">Selected</Badge>
              )}
            </div>
          </div>
          <CardDescription>
            {getStyleDescription(style)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Inline Citation */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Inline Citation
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(result.inline, 'citation')}
                className="h-6 w-6 p-0"
              >
                {copiedCitation === result.inline ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </h4>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              {result.inline || 'No citation generated'}
            </div>
          </div>

          <Separator />

          {/* Bibliography Entry */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              Bibliography Entry
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(result.bibliography, 'bibliography')}
                className="h-6 w-6 p-0"
              >
                {copiedBibliography === result.bibliography ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </h4>
            <div className="bg-muted p-3 rounded-md text-sm">
              {result.bibliography || 'No bibliography entry generated'}
            </div>
          </div>

          {/* Validation Messages */}
          {(result.errors.length > 0 || result.warnings.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                {result.errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
                {result.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-yellow-600">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const getStyleDescription = (style: CitationStyle): string => {
    switch (style) {
      case CitationStyle.APA:
        return 'American Psychological Association - Social sciences, education, psychology';
      case CitationStyle.MLA:
        return 'Modern Language Association - Humanities, literature, arts';
      case CitationStyle.CHICAGO:
        return 'Chicago Manual of Style - History, social sciences, fine arts';
      case CitationStyle.HARVARD:
        return 'Harvard Referencing - Natural sciences, technology, medicine';
      case CitationStyle.IEEE:
        return 'Institute of Electrical and Electronics Engineers - Engineering, computer science';
      case CitationStyle.VANCOUVER:
        return 'Vancouver System - Medicine, health sciences';
      default:
        return 'Citation style description not available';
    }
  };

  if (!reference) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Select a reference to format citations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Style Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Citation Style</CardTitle>
          <CardDescription>
            Choose a citation style for your academic work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CitationStyle).map(style => (
                <SelectItem key={style} value={style}>
                  {style.toUpperCase()} - {getStyleDescription(style)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Citation Results */}
      <div className="space-y-4">
        {renderCitationCard(selectedStyle)}
      </div>

      {/* Style Selector Buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.values(CitationStyle).map(style => (
          <Button
            key={style}
            variant={style === selectedStyle ? "default" : "outline"}
            size="sm"
            onClick={() => handleStyleChange(style)}
            className="text-xs"
          >
            {style.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Reference Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reference Information</CardTitle>
          <CardDescription>
            Details about the selected reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Title:</strong> {reference.title}
            </div>
            {reference.authors.length > 0 && (
              <div>
                <strong>Authors:</strong> {reference.authors.join(', ')}
              </div>
            )}
            {reference.journal && (
              <div>
                <strong>Journal:</strong> {reference.journal}
              </div>
            )}
            {reference.publication_date && (
              <div>
                <strong>Publication Date:</strong> {reference.publication_date}
              </div>
            )}
            {reference.doi && (
              <div>
                <strong>DOI:</strong>
                <a
                  href={`https://doi.org/${reference.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {reference.doi}
                </a>
              </div>
            )}
            {reference.url && (
              <div>
                <strong>URL:</strong>
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  {reference.url}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
