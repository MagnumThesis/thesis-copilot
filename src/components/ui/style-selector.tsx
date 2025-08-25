/**
 * Style Selector Component
 * Allows users to select citation styles for formatting
 */

import React from 'react';
import { CitationStyle } from '../../lib/ai-types.js';
import { Label } from './shadcn/label.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './shadcn/select.js';
import { Badge } from './shadcn/badge.js';

export interface StyleSelectorProps {
  selectedStyle: CitationStyle;
  onStyleChange: (style: CitationStyle) => void;
  disabled?: boolean;
  className?: string;
  showDescription?: boolean;
}

export interface CitationStyleInfo {
  style: CitationStyle;
  name: string;
  description: string;
  example: string;
  commonFields: string[];
}

const CITATION_STYLES: CitationStyleInfo[] = [
  {
    style: CitationStyle.APA,
    name: 'APA 7th Edition',
    description: 'American Psychological Association - Social sciences, education, psychology',
    example: '(Author, Year)',
    commonFields: ['Author', 'Year', 'Title', 'DOI/URL']
  },
  {
    style: CitationStyle.MLA,
    name: 'MLA 9th Edition',
    description: 'Modern Language Association - Humanities, literature, arts',
    example: '(Author Page)',
    commonFields: ['Author', 'Title', 'Container', 'Publication Date']
  },
  {
    style: CitationStyle.CHICAGO,
    name: 'Chicago 17th Edition',
    description: 'Chicago Manual of Style - History, social sciences, humanities',
    example: '(Author Year, Page)',
    commonFields: ['Author', 'Title', 'Publisher', 'Publication Date']
  },
  {
    style: CitationStyle.HARVARD,
    name: 'Harvard',
    description: 'Author-Date system - Natural sciences, social sciences',
    example: '(Author Year)',
    commonFields: ['Author', 'Year', 'Title', 'Publisher']
  },
  {
    style: CitationStyle.IEEE,
    name: 'IEEE',
    description: 'Institute of Electrical and Electronics Engineers - Engineering, technology',
    example: '[1]',
    commonFields: ['Author', 'Title', 'Journal', 'Year']
  },
  {
    style: CitationStyle.VANCOUVER,
    name: 'Vancouver',
    description: 'Author-Number system - Medicine, life sciences',
    example: '(1)',
    commonFields: ['Author', 'Title', 'Journal', 'Year']
  }
];

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  disabled = false,
  className = '',
  showDescription = true
}) => {
  const selectedStyleInfo = CITATION_STYLES.find(style => style.style === selectedStyle);

  const handleStyleChange = (value: string) => {
    const style = value as CitationStyle;
    onStyleChange(style);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main selector */}
      <div className="space-y-2">
        <Label htmlFor="citation-style" className="text-sm font-medium">
          Citation Style
        </Label>
        <Select
          value={selectedStyle}
          onValueChange={handleStyleChange}
          disabled={disabled}
        >
          <SelectTrigger id="citation-style" className="w-full">
            <SelectValue placeholder="Select citation style" />
          </SelectTrigger>
          <SelectContent>
            {CITATION_STYLES.map((styleInfo) => (
              <SelectItem key={styleInfo.style} value={styleInfo.style}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="font-medium">{styleInfo.name}</span>
                    {showDescription && (
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {styleInfo.description}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {styleInfo.example}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Style information display */}
      {selectedStyleInfo && showDescription && (
        <div className="p-3 bg-muted/50 rounded-md border">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm">{selectedStyleInfo.name}</h4>
            <Badge variant="outline" className="text-xs">
              {selectedStyleInfo.example}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {selectedStyleInfo.description}
          </p>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Common Fields:</p>
            <div className="flex flex-wrap gap-1">
              {selectedStyleInfo.commonFields.map((field) => (
                <Badge key={field} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {field}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick style selector for common styles */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Quick Select:</span>
        {CITATION_STYLES.slice(0, 4).map((styleInfo) => (
          <button
            key={styleInfo.style}
            onClick={() => onStyleChange(styleInfo.style)}
            disabled={disabled}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              selectedStyle === styleInfo.style
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-input'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {styleInfo.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
