import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './shadcn/card';
import { Button } from './shadcn/button';
import { Badge } from './shadcn/badge';
import { Textarea } from './shadcn/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './shadcn/tabs';
import { Alert, AlertDescription } from './shadcn/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Lightbulb, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  Zap,
  Target,
  TrendingUp,
  Settings
} from 'lucide-react';
import { 
  QueryRefinement, 
  BreadthAnalysis, 
  AlternativeTerms, 
  OptimizationRecommendation, 
  RefinedQuery,
  ValidationResult,
  TermSuggestion
} from '../../worker/lib/query-generation-engine';

interface QueryRefinementPanelProps {
  originalQuery: string;
  refinement: QueryRefinement;
  onQueryUpdate: (newQuery: string) => void;
  onApplyRefinement: (refinedQuery: RefinedQuery) => void;
  onRegenerateRefinement: () => void;
  isLoading?: boolean;
}

export const QueryRefinementPanel: React.FC<QueryRefinementPanelProps> = ({
  originalQuery,
  refinement,
  onQueryUpdate,
  onApplyRefinement,
  onRegenerateRefinement,
  isLoading = false
}) => {
  const [currentQuery, setCurrentQuery] = useState(originalQuery);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCurrentQuery(originalQuery);
  }, [originalQuery]);

  const handleQueryChange = (newQuery: string) => {
    setCurrentQuery(newQuery);
    onQueryUpdate(newQuery);
  };

  const handleTermToggle = (term: string) => {
    const newSelected = new Set(selectedTerms);
    if (newSelected.has(term)) {
      newSelected.delete(term);
    } else {
      newSelected.add(term);
    }
    setSelectedTerms(newSelected);
  };

  const handleApplySelectedTerms = () => {
    if (selectedTerms.size === 0) return;
    
    const termsToAdd = Array.from(selectedTerms);
    const updatedQuery = `(${currentQuery}) OR (${termsToAdd.map(t => `"${t}"`).join(' OR ')})`;
    handleQueryChange(updatedQuery);
    setSelectedTerms(new Set());
  };

  const getBreadthIcon = (classification: string) => {
    switch (classification) {
      case 'too_narrow': return <Target className="h-4 w-4 text-red-500" />;
      case 'too_broad': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'optimal': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getBreadthColor = (classification: string) => {
    switch (classification) {
      case 'too_narrow': return 'border-red-200 bg-red-50';
      case 'too_broad': return 'border-yellow-200 bg-yellow-50';
      case 'optimal': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBreadthAnalysis = (analysis: BreadthAnalysis) => (
    <Card className={`${getBreadthColor(analysis.classification)}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getBreadthIcon(analysis.classification)}
          Query Breadth Analysis
          <Badge variant="outline" className="ml-auto">
            Score: {analysis.breadthScore.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Classification:</span>
          <Badge className={`${analysis.classification === 'optimal' ? 'bg-green-100 text-green-800' : 
            analysis.classification === 'too_narrow' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'}`}>
            {analysis.classification.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Specificity:</span>
          <Badge variant="outline">{analysis.specificityLevel.replace('_', ' ')}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Term Count:</span>
          <Badge variant="outline">{analysis.termCount}</Badge>
        </div>
        
        <p className="text-sm text-gray-600">{analysis.reasoning}</p>
        
        {analysis.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Suggestions:</h4>
            {analysis.suggestions.map((suggestion, index) => (
              <Alert key={index} className="py-2">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{suggestion.suggestion}</span>
                    <Badge className={getImpactColor(suggestion.impact)}>
                      {suggestion.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{suggestion.reasoning}</p>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderValidationResults = (validation: ValidationResult) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {validation.isValid ? 
            <CheckCircle className="h-4 w-4 text-green-500" /> : 
            <AlertTriangle className="h-4 w-4 text-red-500" />
          }
          Query Validation
          <Badge variant="outline" className="ml-auto">
            Confidence: {(validation.confidence * 100).toFixed(0)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {validation.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-red-700">Issues Found:</h4>
            {validation.issues.map((issue, index) => (
              <Alert key={index} className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-sm text-red-700">
                  {issue}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {validation.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-blue-700">Suggestions:</h4>
            {validation.suggestions.map((suggestion, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-sm text-blue-700">
                  {suggestion}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAlternativeTerms = (terms: AlternativeTerms) => (
    <div className="space-y-4">
      {Object.entries(terms).map(([category, termList]) => {
        if (termList.length === 0) return null;
        
        const categoryLabels: Record<string, string> = {
          synonyms: 'Synonyms',
          relatedTerms: 'Related Terms',
          broaderTerms: 'Broader Terms',
          narrowerTerms: 'Narrower Terms',
          academicVariants: 'Academic Variants'
        };
        
        return (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-medium">{categoryLabels[category]}:</h4>
            <div className="flex flex-wrap gap-2">
              {termList.map((termSuggestion: TermSuggestion, index: number) => (
                <Button
                  key={index}
                  variant={selectedTerms.has(termSuggestion.term) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTermToggle(termSuggestion.term)}
                  className="text-xs"
                >
                  {termSuggestion.term}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {(termSuggestion.confidence * 100).toFixed(0)}%
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        );
      })}
      
      {selectedTerms.size > 0 && (
        <div className="pt-2 border-t">
          <Button onClick={handleApplySelectedTerms} className="w-full">
            Add {selectedTerms.size} Selected Term{selectedTerms.size !== 1 ? 's' : ''} to Query
          </Button>
        </div>
      )}
    </div>
  );

  const renderOptimizationRecommendations = (recommendations: OptimizationRecommendation[]) => (
    <div className="space-y-3">
      {recommendations.map((rec, index) => (
        <Card key={index} className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-sm">{rec.description}</span>
              </div>
              <div className="flex gap-1">
                <Badge className={getImpactColor(rec.impact)}>{rec.impact}</Badge>
                <Badge variant="outline">Priority {rec.priority}</Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{rec.reasoning}</p>
            
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium">Before:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{rec.beforeQuery}</code>
              </div>
              <div>
                <span className="font-medium">After:</span>
                <code className="ml-2 bg-green-100 px-2 py-1 rounded">{rec.afterQuery}</code>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => handleQueryChange(rec.afterQuery)}
            >
              Apply Recommendation
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderRefinedQueries = (queries: RefinedQuery[]) => (
    <div className="space-y-3">
      {queries.map((query, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="font-medium text-sm capitalize">
                  {query.refinementType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-1">
                <Badge variant="outline">
                  {(query.confidence * 100).toFixed(0)}% confidence
                </Badge>
                <Badge className={
                  query.expectedResults === 'more' ? 'bg-blue-100 text-blue-800' :
                  query.expectedResults === 'fewer' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }>
                  {query.expectedResults} results
                </Badge>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{query.description}</p>
            
            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <code className="text-sm">{query.query}</code>
            </div>
            
            <div className="space-y-1 mb-3">
              {query.changes.map((change, changeIndex) => (
                <div key={changeIndex} className="text-xs text-gray-500">
                  <Badge variant="outline" className="mr-2">
                    {change.type}
                  </Badge>
                  {change.element}: {change.reasoning}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onApplyRefinement(query)}
              >
                Use This Query
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQueryChange(query.query)}
              >
                Edit Further
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Current Query Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Query Editor</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerateRefinement}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate Analysis
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Enter your search query..."
            className="min-h-[100px] font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">
            Use search operators like AND, OR, and quotes for exact phrases
          </p>
        </CardContent>
      </Card>

      {/* Refinement Analysis Tabs */}
      <Tabs defaultValue="breadth" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="breadth">Breadth</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="recommendations">Optimize</TabsTrigger>
          <TabsTrigger value="refined">Refined</TabsTrigger>
        </TabsList>
        
        <TabsContent value="breadth" className="mt-4">
          {renderBreadthAnalysis(refinement.breadthAnalysis)}
        </TabsContent>
        
        <TabsContent value="validation" className="mt-4">
          {renderValidationResults(refinement.validationResults)}
        </TabsContent>
        
        <TabsContent value="terms" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Alternative Terms</CardTitle>
            </CardHeader>
            <CardContent>
              {renderAlternativeTerms(refinement.alternativeTerms)}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Optimization Recommendations</h3>
            {renderOptimizationRecommendations(refinement.optimizationRecommendations)}
          </div>
        </TabsContent>
        
        <TabsContent value="refined" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Refined Query Variations</h3>
            {renderRefinedQueries(refinement.refinedQueries)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};