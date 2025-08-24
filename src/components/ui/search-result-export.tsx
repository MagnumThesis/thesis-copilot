"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Checkbox } from "./shadcn/checkbox"
import { Label } from "./shadcn/label"
import { Textarea } from "./shadcn/textarea"
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Code, 
  Share2,
  Copy,
  Check,
  X
} from "lucide-react"
import { ScholarSearchResult, CitationStyle } from "../../lib/ai-types"

export type ExportFormat = 'json' | 'csv' | 'bibtex' | 'ris' | 'txt' | 'markdown'

export interface ExportOptions {
  format: ExportFormat
  includeScores: boolean
  includeAbstracts: boolean
  includeUrls: boolean
  includeDoi: boolean
  includeKeywords: boolean
  citationStyle?: CitationStyle
  customFields?: string[]
  filename?: string
}

interface SearchResultExportProps {
  results: ScholarSearchResult[]
  onExport: (results: ScholarSearchResult[], options: ExportOptions) => Promise<string>
  onClose?: () => void
  className?: string
}

export const SearchResultExport: React.FC<SearchResultExportProps> = ({
  results,
  onExport,
  onClose,
  className = ""
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeScores: true,
    includeAbstracts: true,
    includeUrls: true,
    includeDoi: true,
    includeKeywords: true,
    citationStyle: CitationStyle.APA,
    filename: `search-results-${new Date().toISOString().split('T')[0]}`
  })
  
  const [isExporting, setIsExporting] = useState(false)
  const [exportedContent, setExportedContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const content = await onExport(results, exportOptions)
      setExportedContent(content)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (!exportedContent) return

    const blob = new Blob([exportedContent], { 
      type: getContentType(exportOptions.format) 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportOptions.filename}.${exportOptions.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyToClipboard = async () => {
    if (!exportedContent) return

    try {
      await navigator.clipboard.writeText(exportedContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getContentType = (format: ExportFormat): string => {
    switch (format) {
      case 'json':
        return 'application/json'
      case 'csv':
        return 'text/csv'
      case 'bibtex':
        return 'application/x-bibtex'
      case 'ris':
        return 'application/x-research-info-systems'
      case 'txt':
        return 'text/plain'
      case 'markdown':
        return 'text/markdown'
      default:
        return 'text/plain'
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'json':
      case 'bibtex':
      case 'ris':
        return <Code className="h-4 w-4" />
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />
      case 'txt':
      case 'markdown':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }))
    setExportedContent(null) // Clear previous export when options change
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Search Results ({results.length} results)
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select 
              value={exportOptions.format} 
              onValueChange={(value) => updateExportOptions({ format: value as ExportFormat })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    JSON - Structured data
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV - Spreadsheet format
                  </div>
                </SelectItem>
                <SelectItem value="bibtex">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    BibTeX - LaTeX citations
                  </div>
                </SelectItem>
                <SelectItem value="ris">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    RIS - Reference manager format
                  </div>
                </SelectItem>
                <SelectItem value="txt">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Plain Text - Simple list
                  </div>
                </SelectItem>
                <SelectItem value="markdown">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Markdown - Formatted text
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Citation Style (for BibTeX, RIS, and text formats) */}
          {(['bibtex', 'ris', 'txt', 'markdown'].includes(exportOptions.format)) && (
            <div className="space-y-2">
              <Label>Citation Style</Label>
              <Select 
                value={exportOptions.citationStyle} 
                onValueChange={(value) => updateExportOptions({ citationStyle: value as CitationStyle })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CitationStyle.APA}>APA</SelectItem>
                  <SelectItem value={CitationStyle.MLA}>MLA</SelectItem>
                  <SelectItem value={CitationStyle.CHICAGO}>Chicago</SelectItem>
                  <SelectItem value={CitationStyle.HARVARD}>Harvard</SelectItem>
                  <SelectItem value={CitationStyle.IEEE}>IEEE</SelectItem>
                  <SelectItem value={CitationStyle.VANCOUVER}>Vancouver</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-scores"
                  checked={exportOptions.includeScores}
                  onCheckedChange={(checked) => updateExportOptions({ includeScores: !!checked })}
                />
                <Label htmlFor="include-scores" className="text-sm">Relevance scores</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-abstracts"
                  checked={exportOptions.includeAbstracts}
                  onCheckedChange={(checked) => updateExportOptions({ includeAbstracts: !!checked })}
                />
                <Label htmlFor="include-abstracts" className="text-sm">Abstracts</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-urls"
                  checked={exportOptions.includeUrls}
                  onCheckedChange={(checked) => updateExportOptions({ includeUrls: !!checked })}
                />
                <Label htmlFor="include-urls" className="text-sm">URLs</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-doi"
                  checked={exportOptions.includeDoi}
                  onCheckedChange={(checked) => updateExportOptions({ includeDoi: !!checked })}
                />
                <Label htmlFor="include-doi" className="text-sm">DOI</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-keywords"
                  checked={exportOptions.includeKeywords}
                  onCheckedChange={(checked) => updateExportOptions({ includeKeywords: !!checked })}
                />
                <Label htmlFor="include-keywords" className="text-sm">Keywords</Label>
              </div>
            </div>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename (without extension)</Label>
            <input
              id="filename"
              type="text"
              value={exportOptions.filename || ''}
              onChange={(e) => updateExportOptions({ filename: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="search-results"
            />
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || results.length === 0}
            className="w-full flex items-center gap-2"
          >
            {getFormatIcon(exportOptions.format)}
            {isExporting ? 'Generating Export...' : `Generate ${exportOptions.format.toUpperCase()} Export`}
          </Button>
        </CardContent>
      </Card>

      {/* Export Preview/Download */}
      {exportedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            <div className="max-h-64 overflow-y-auto">
              <Textarea
                value={exportedContent.substring(0, 1000) + (exportedContent.length > 1000 ? '\n\n... (truncated)' : '')}
                readOnly
                className="min-h-32 font-mono text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Export contains {results.length} results ({exportedContent.length.toLocaleString()} characters)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}