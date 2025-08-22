/**
 * Citation Validation Display Component
 * Shows validation errors and warnings for references and citations
 */

import React from 'react';
import { ValidationResult, ValidationError } from '../../lib/ai-types.js';
import { Alert, AlertDescription, AlertTitle } from './shadcn/alert.js';
import { Badge } from './shadcn/badge.js';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface CitationValidationDisplayProps {
  validationResult: ValidationResult | null;
  className?: string;
  showOnlyErrors?: boolean;
  compact?: boolean;
}

export const CitationValidationDisplay: React.FC<CitationValidationDisplayProps> = ({
  validationResult,
  className = '',
  showOnlyErrors = false,
  compact = false
}) => {
  if (!validationResult) {
    return null;
  }

  const { isValid, errors, warnings, missingFields } = validationResult;

  // Don't render if valid and showing only errors
  if (isValid && showOnlyErrors) {
    return null;
  }

  // Don't render if no issues to show
  if (isValid && errors.length === 0 && warnings.length === 0 && showOnlyErrors) {
    return null;
  }

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getAlertVariant = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return 'destructive' as const;
      case 'warning':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const renderValidationIssue = (issue: ValidationError, index: number) => {
    if (compact) {
      return (
        <div key={index} className="flex items-center gap-2 text-sm">
          {getSeverityIcon(issue.severity)}
          <span className="text-muted-foreground">{issue.message}</span>
          <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
            {issue.field}
          </Badge>
        </div>
      );
    }

    return (
      <Alert key={index} variant={getAlertVariant(issue.severity)} className="mb-2">
        <div className="flex items-start gap-2">
          {getSeverityIcon(issue.severity)}
          <div className="flex-1">
            <AlertTitle className="text-sm font-medium mb-1">
              {issue.field.charAt(0).toUpperCase() + issue.field.slice(1)} Issue
            </AlertTitle>
            <AlertDescription className="text-sm">
              {issue.message}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  const renderMissingFields = () => {
    if (missingFields.length === 0) return null;

    if (compact) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Missing fields: {missingFields.join(', ')}
          </span>
        </div>
      );
    }

    return (
      <Alert className="mb-2">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium mb-1">Missing Fields</AlertTitle>
        <AlertDescription className="text-sm">
          Consider adding: {missingFields.join(', ')}
        </AlertDescription>
      </Alert>
    );
  };

  const renderValidationSummary = () => {
    const totalIssues = errors.length + warnings.length;
    const hasErrors = errors.length > 0;

    if (compact) {
      return (
        <div className="flex items-center gap-2 mb-2">
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : hasErrors ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <span className="text-sm font-medium">
            {isValid ? 'Valid' : hasErrors ? 'Invalid' : 'Warnings'}
          </span>
          {totalIssues > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalIssues} issue{totalIssues !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-md">
        {isValid ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : hasErrors ? (
          <XCircle className="h-4 w-4 text-red-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <span className="text-sm font-medium">
          Validation Status: {isValid ? 'Valid' : hasErrors ? 'Invalid' : 'Has Warnings'}
        </span>
        {totalIssues > 0 && (
          <Badge variant={hasErrors ? 'destructive' : 'secondary'} className="text-xs">
            {errors.length > 0 && `${errors.length} error${errors.length !== 1 ? 's' : ''}`}
            {errors.length > 0 && warnings.length > 0 && ', '}
            {warnings.length > 0 && `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Validation summary */}
      {!compact && renderValidationSummary()}

      {/* Missing fields */}
      {!showOnlyErrors && renderMissingFields()}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {!compact && (
            <h4 className="text-sm font-medium text-red-600 mb-2">Errors</h4>
          )}
          {errors.map((error, index) => renderValidationIssue(error, index))}
        </div>
      )}

      {/* Warnings */}
      {!showOnlyErrors && warnings.length > 0 && (
        <div className="space-y-1">
          {!compact && (
            <h4 className="text-sm font-medium text-yellow-600 mb-2">Warnings</h4>
          )}
          {warnings.map((warning, index) => renderValidationIssue(warning, index))}
        </div>
      )}

      {/* Compact summary at the end */}
      {compact && (errors.length > 0 || warnings.length > 0) && renderValidationSummary()}
    </div>
  );
};

export default CitationValidationDisplay;
