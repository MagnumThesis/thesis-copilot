"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Button } from './shadcn/button';
import { Checkbox } from './shadcn/checkbox';
import { Badge } from './shadcn/badge';

import { FileText, Lightbulb, Search, AlertCircle, CheckCircle } from 'lucide-react';

interface ContentSelectorProps {
  conversationId: string;
  selectedSources: {
    ideas: string[];
    builder: string[];
  };
  onSelectionChange: (sources: { ideas: string[]; builder: string[] }) => void;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'idea' | 'builder';
  description?: string;
  lastModified?: Date;
  wordCount?: number;
  confidence?: number;
}

export const ContentSelector: React.FC<ContentSelectorProps> = ({
  conversationId,
  selectedSources,
  onSelectionChange
}) => {
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - in real implementation, this would fetch from APIs
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockContent: ContentItem[] = [
          {
            id: 'idea_1',
            title: 'Research Methodology for AI in Education',
            type: 'idea',
            description: 'Exploring how artificial intelligence can enhance educational outcomes and personalize learning experiences.',
            lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            wordCount: 245,
            confidence: 0.85
          },
          {
            id: 'idea_2',
            title: 'Machine Learning Approaches in Healthcare',
            type: 'idea',
            description: 'Analysis of different machine learning techniques applied to medical diagnosis and treatment planning.',
            lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            wordCount: 189,
            confidence: 0.78
          },
          {
            id: 'builder_1',
            title: 'Literature Review: AI Ethics and Bias',
            type: 'builder',
            description: 'Comprehensive review of ethical considerations and bias mitigation strategies in AI systems.',
            lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            wordCount: 1250,
            confidence: 0.92
          },
          {
            id: 'builder_2',
            title: 'Research Proposal: Automated Code Review',
            type: 'builder',
            description: 'Proposal for developing AI-powered tools to assist with code review and quality assurance.',
            lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            wordCount: 890,
            confidence: 0.88
          },
          {
            id: 'idea_3',
            title: 'Natural Language Processing in Customer Service',
            type: 'idea',
            description: 'How NLP technologies can improve automated customer service systems and chatbots.',
            lastModified: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            wordCount: 156,
            confidence: 0.81
          }
        ];

        setAvailableContent(mockContent);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [conversationId]);

  const handleItemToggle = (item: ContentItem) => {
    const currentSelected = selectedSources[item.type];
    const isSelected = currentSelected.includes(item.id);

    const newSelection = isSelected
      ? currentSelected.filter(id => id !== item.id)
      : [...currentSelected, item.id];

    onSelectionChange({
      ...selectedSources,
      [item.type]: newSelection
    });
  };

  const handleSelectAll = (type: 'idea' | 'builder') => {
    const itemsOfType = availableContent.filter(item => item.type === type);
    const allSelected = itemsOfType.every(item => selectedSources[type].includes(item.id));

    if (allSelected) {
      // Deselect all
      onSelectionChange({
        ...selectedSources,
        [type]: []
      });
    } else {
      // Select all
      onSelectionChange({
        ...selectedSources,
        [type]: itemsOfType.map(item => item.id)
      });
    }
  };

  const getSelectedItems = () => {
    return availableContent.filter(item =>
      selectedSources[item.type].includes(item.id)
    );
  };

  const getTotalWordCount = () => {
    const selectedItems = getSelectedItems();
    return selectedItems.reduce((total, item) => total + (item.wordCount || 0), 0);
  };

  const getAverageConfidence = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) return 0;

    const totalConfidence = selectedItems.reduce((total, item) => total + (item.confidence || 0), 0);
    return totalConfidence / selectedItems.length;
  };

  const renderContentItem = (item: ContentItem) => {
    const isSelected = selectedSources[item.type].includes(item.id);

    return (
      <div
        key={item.id}
        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onClick={() => handleItemToggle(item)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Checkbox
              checked={isSelected}
              onChange={() => handleItemToggle(item)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium truncate">{item.title}</h4>
                <Badge variant="secondary" className="text-xs">
                  {item.type === 'idea' ? 'Idea' : 'Document'}
                </Badge>
                {item.confidence && (
                  <Badge
                    variant={item.confidence > 0.8 ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {(item.confidence * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {item.wordCount && (
                  <span>{item.wordCount} words</span>
                )}
                {item.lastModified && (
                  <span>{item.lastModified.toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            {item.type === 'idea' ? (
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            ) : (
              <FileText className="h-4 w-4 text-blue-500" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContentTypeSection = (type: 'idea' | 'builder', title: string, icon: React.ElementType) => {
    const itemsOfType = availableContent.filter(item => item.type === type);
    const selectedCount = selectedSources[type].length;
    const Icon = icon;

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <CardTitle className="text-base">{title}</CardTitle>
              <Badge variant="outline">{itemsOfType.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectAll(type)}
              disabled={itemsOfType.length === 0}
            >
              {selectedCount === itemsOfType.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          <CardDescription>
            {type === 'idea'
              ? 'Research ideas and concepts for analysis'
              : 'Builder documents and research papers'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {itemsOfType.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No {type === 'idea' ? 'ideas' : 'documents'} available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itemsOfType.map(renderContentItem)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading content sources...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedItems = getSelectedItems();
  const totalWordCount = getTotalWordCount();
  const averageConfidence = getAverageConfidence();

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {selectedItems.length} source{selectedItems.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{totalWordCount.toLocaleString()} words</span>
                <span>{(averageConfidence * 100).toFixed(1)}% avg confidence</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Type Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderContentTypeSection('idea', 'Research Ideas', Lightbulb)}
        {renderContentTypeSection('builder', 'Builder Documents', FileText)}
      </div>

      {/* Selection Tips */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Search className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Tips for better results:</p>
              <ul className="space-y-1 text-xs">
                <li>• Select content with clear research topics and keywords</li>
                <li>• Combine ideas and documents for comprehensive analysis</li>
                <li>• Higher confidence scores indicate better content quality</li>
                <li>• More words generally provide better search results</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
