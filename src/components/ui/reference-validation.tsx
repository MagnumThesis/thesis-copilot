"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Separator } from "./shadcn/separator"
import { Reference, ReferenceType, ValidationError } from "../../lib/ai-types"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Shield } from "lucide-react"

/**
 * Props for the ReferenceValidation component
 */
interface ReferenceValidationProps {
  /** Array of references to validate */
  references: Reference[]
  /** Callback function called when validation is complete */
  onValidationComplete: (results: ValidationResult[]) => void
  /** Callback function called when a fix suggestion is applied */
  onFixSuggestion: (referenceId: string, suggestion: ValidationSuggestion) => void
  /** Additional CSS classes to apply to the component */
  className?: string
  /** Whether to automatically validate references when they change */
  autoValidate?: boolean
}

/**
 * Result of validating a single reference
 */
interface ValidationResult {
  /** The ID of the reference that was validated */
  referenceId: string
  /** Whether the reference is valid (no errors) */
  isValid: boolean
  /** Validation score from 0-100, where 100 is perfect */
  score: number
  /** Validation errors found */
  errors: ValidationError[]
  /** Validation warnings found */
  warnings: ValidationError[]
  /** Suggestions for improving the reference */
  suggestions: ValidationSuggestion[]
}

/**
 * A suggestion for fixing or improving a reference
 */
interface ValidationSuggestion {
  /** Type of suggestion */
  type: 'fix' | 'improve' | 'verify'
  /** The field this suggestion applies to */
  field: string
  /** Description of the suggestion */
  message: string
  /** Optional action to take when applying the suggestion */
  action?: () => void
}

/**
 * A component for validating references and providing suggestions for improvement.
 * This component checks references for required fields, proper formatting, and other issues,
 * and provides actionable suggestions for fixing problems.
 * 
 * @param {ReferenceValidationProps} props - The props for the ReferenceValidation component
 * @param {Reference[]} props.references - Array of references to validate
 * @param {(results: ValidationResult[]) => void} props.onValidationComplete - Callback function called when validation is complete
 * @param {(referenceId: string, suggestion: ValidationSuggestion) => void} props.onFixSuggestion - Callback function called when a fix suggestion is applied
 * @param {string} [props.className] - Additional CSS classes to apply to the component
 * @param {boolean} [props.autoValidate=true] - Whether to automatically validate references when they change
 * 
 * @example
 * ```tsx
 * <ReferenceValidation
 *   references={referenceList}
 *   onValidationComplete={(results) => console.log("Validation results:", results)}
 *   onFixSuggestion={(refId, suggestion) => console.log("Applying suggestion:", suggestion)}
 * />
 * ```
 */
export const ReferenceValidation: React.FC<ReferenceValidationProps> = ({
  references,
  onValidationComplete,
  onFixSuggestion,
  className = '',
  autoValidate = true
}) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [selectedReference, setSelectedReference] = useState<string | null>(null)

  useEffect(() => {
    if (autoValidate && references.length > 0) {
      validateReferences()
    }
  }, [references, autoValidate])

  const validateReferences = async () => {
    setIsValidating(true)

    try {
      const results = await Promise.all(
        references.map(ref => validateReference(ref))
      )

      setValidationResults(results)
      onValidationComplete(results)
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const validateReference = async (reference: Reference): Promise<ValidationResult> => {
    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const suggestions: ValidationSuggestion[] = []

    let score = 100

    // Required fields validation
    const requiredFields = getRequiredFields(reference.type)

    for (const field of requiredFields) {
      const value = (reference as any)[field]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          field,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          severity: 'error'
        })
        score -= 20
      }
    }

    // Author validation
    if (reference.authors.length === 0) {
      errors.push({
        field: 'authors',
        message: 'At least one author is required',
        severity: 'error'
      })
      score -= 20
    } else {
      // Check author completeness
      reference.authors.forEach((author, index) => {
        if (!author.firstName?.trim() || !author.lastName?.trim()) {
          warnings.push({
            field: `authors.${index}`,
            message: `Author ${index + 1} is incomplete`,
            severity: 'warning'
          })
          score -= 5
        }
      })
    }

    // URL validation
    if (reference.url && !isValidUrl(reference.url)) {
      errors.push({
        field: 'url',
        message: 'Invalid URL format',
        severity: 'error'
      })
      score -= 10
    }

    // DOI validation
    if (reference.doi && !isValidDoi(reference.doi)) {
      errors.push({
        field: 'doi',
        message: 'Invalid DOI format',
        severity: 'error'
      })
      score -= 10
    }

    // Date validation
    if (reference.publicationDate) {
      const date = new Date(reference.publicationDate)
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'publicationDate',
          message: 'Invalid publication date',
          severity: 'error'
        })
        score -= 10
      } else if (date > new Date()) {
        warnings.push({
          field: 'publicationDate',
          message: 'Publication date is in the future',
          severity: 'warning'
        })
        score -= 5
      }
    }

    // Journal article specific validation
    if (reference.type === ReferenceType.JOURNAL_ARTICLE) {
      if (!reference.journal?.trim()) {
        errors.push({
          field: 'journal',
          message: 'Journal name is required for journal articles',
          severity: 'error'
        })
        score -= 15
      }
    }

    // Book specific validation
    if (reference.type === ReferenceType.BOOK || reference.type === ReferenceType.BOOK_CHAPTER) {
      if (!reference.publisher?.trim()) {
        errors.push({
          field: 'publisher',
          message: 'Publisher is required for books',
          severity: 'error'
        })
        score -= 15
      }
    }

    // URL accessibility check (optional)
    if (reference.url) {
      try {
        const response = await fetch(`/api/validate-url?url=${encodeURIComponent(reference.url)}`)
        if (response.ok) {
          const { accessible } = await response.json()
          if (!accessible) {
            warnings.push({
              field: 'url',
              message: 'URL may not be accessible',
              severity: 'warning'
            })
            score -= 5
          }
        }
      } catch (error) {
        // Ignore URL validation errors
      }
    }

    // Generate suggestions
    if (score < 100) {
      if (errors.length > 0) {
        suggestions.push({
          type: 'fix',
          field: 'general',
          message: 'Fix critical validation errors',
          action: () => setSelectedReference(reference.id)
        })
      }

      if (!reference.doi && reference.url) {
        suggestions.push({
          type: 'improve',
          field: 'doi',
          message: 'Consider adding DOI for better reference quality',
          action: () => onFixSuggestion(reference.id, {
            type: 'improve',
            field: 'doi',
            message: 'Add DOI'
          })
        })
      }

      if (!reference.notes?.trim()) {
        suggestions.push({
          type: 'improve',
          field: 'notes',
          message: 'Add notes for personal reference',
          action: () => onFixSuggestion(reference.id, {
            type: 'improve',
            field: 'notes',
            message: 'Add notes'
          })
        })
      }
    }

    score = Math.max(0, Math.min(100, score))

    return {
      referenceId: reference.id,
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions
    }
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  const isValidDoi = (doi: string): boolean => {
    return /^10\.\d{4,}\/.*/.test(doi)
  }

  const getRequiredFields = (type: ReferenceType): string[] => {
    switch (type) {
      case ReferenceType.JOURNAL_ARTICLE:
        return ['title', 'authors', 'journal', 'publicationDate']
      case ReferenceType.BOOK:
        return ['title', 'authors', 'publisher', 'publicationDate']
      case ReferenceType.BOOK_CHAPTER:
        return ['title', 'authors', 'publisher', 'publicationDate']
      case ReferenceType.CONFERENCE_PAPER:
        return ['title', 'authors', 'publicationDate']
      case ReferenceType.THESIS:
        return ['title', 'authors', 'publisher', 'publicationDate']
      case ReferenceType.WEBSITE:
        return ['title', 'url']
      case ReferenceType.REPORT:
        return ['title', 'authors', 'publisher', 'publicationDate']
      case ReferenceType.PATENT:
        return ['title', 'authors', 'publicationDate']
      default:
        return ['title', 'authors']
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 70) return <Shield className="h-4 w-4 text-yellow-600" />
    if (score >= 50) return <AlertTriangle className="h-4 w-4 text-orange-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const selectedResult = validationResults.find(r => r.referenceId === selectedReference)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Reference Validation</h3>
          <Badge variant="outline" className="text-xs">
            {validationResults.length} references
          </Badge>
        </div>
        <Button
          onClick={validateReferences}
          disabled={isValidating || references.length === 0}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
          {isValidating ? 'Validating...' : 'Re-validate'}
        </Button>
      </div>

      <Separator />

      {/* Overall Statistics */}
      {validationResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-center">
                {validationResults.filter(r => r.isValid).length}
              </div>
              <div className="text-xs text-muted-foreground text-center">Valid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-center text-orange-600">
                {validationResults.filter(r => !r.isValid).length}
              </div>
              <div className="text-xs text-muted-foreground text-center">Invalid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-center text-blue-600">
                {Math.round(validationResults.reduce((sum, r) => sum + r.score, 0) / validationResults.length)}%
              </div>
              <div className="text-xs text-muted-foreground text-center">Avg Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-2xl font-bold text-center">
                {validationResults.reduce((sum, r) => sum + r.suggestions.length, 0)}
              </div>
              <div className="text-xs text-muted-foreground text-center">Suggestions</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Results */}
      <div className="space-y-3">
        {validationResults.map((result) => {
          const reference = references.find(r => r.id === result.referenceId)
          if (!reference) return null

          return (
            <Card key={result.referenceId} className="cursor-pointer">
              <CardHeader className="pb-3" onClick={() => setSelectedReference(result.referenceId)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getScoreIcon(result.score)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{reference.title}</CardTitle>
                      <p className="text-xs text-muted-foreground truncate">
                        {reference.authors[0] ?
                          `${reference.authors[0].lastName}, ${reference.authors[0].firstName}` :
                          'Unknown author'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.isValid ? "secondary" : "destructive"} className="text-xs">
                      {result.score}%
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {reference.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {selectedReference === result.referenceId && (
                <CardContent className="space-y-4">
                  <Separator />

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Errors ({result.errors.length})
                      </h4>
                      <div className="space-y-1">
                        {result.errors.map((error, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                            <XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                            <span className="text-xs text-red-700">{error.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-yellow-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Warnings ({result.warnings.length})
                      </h4>
                      <div className="space-y-1">
                        {result.warnings.map((warning, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                            <AlertTriangle className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                            <span className="text-xs text-yellow-700">{warning.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {result.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-blue-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Suggestions ({result.suggestions.length})
                      </h4>
                      <div className="space-y-1">
                        {result.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <span className="text-xs text-blue-700">{suggestion.message}</span>
                            {suggestion.action && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={suggestion.action}
                                className="h-6 text-xs"
                              >
                                Apply
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {validationResults.length === 0 && !isValidating && (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No References to Validate</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add references to start validation
            </p>
            <Button onClick={validateReferences} disabled={references.length === 0}>
              Validate References
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
