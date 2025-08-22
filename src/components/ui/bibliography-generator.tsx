"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { CitationStyle } from "../../lib/ai-types"
import { FileText, Download, Copy } from "lucide-react"

interface BibliographyGeneratorProps {
  references?: Record<string, unknown>[] // In a real app, this would be Reference[]
  citationStyle?: CitationStyle
  onStyleChange?: (style: CitationStyle) => void
  onExport?: (format: string) => void
}

export const BibliographyGenerator: React.FC<BibliographyGeneratorProps> = ({
  references = [],
  citationStyle = CitationStyle.APA,
  onStyleChange,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState('text')

  const handleStyleChange = (value: string) => {
    if (onStyleChange) {
      onStyleChange(value as CitationStyle)
    }
  }

  const handleFormatChange = (value: string) => {
    setSelectedFormat(value)
  }

  const handleExport = () => {
    if (onExport) {
      onExport(selectedFormat)
    }
  }

  const generateBibliography = () => {
    // This is a simplified version - in a real app you'd use a proper citation library
    if (!references.length) {
      return "No references to display."
    }

    return references.map((ref, index) => {
      const authors = Array.isArray(ref.authors) ? ref.authors.join(', ') : 'Unknown Author'
      const publicationDate = typeof ref.publication_date === 'string' ? ref.publication_date : 'n.d.'
      const title = typeof ref.title === 'string' ? ref.title : 'Untitled'
      const journal = typeof ref.journal === 'string' ? ref.journal : ''
      const publisher = typeof ref.publisher === 'string' ? ref.publisher : ''

      switch (citationStyle) {
        case CitationStyle.APA:
          return `${index + 1}. ${authors} (${publicationDate}). ${title}. ${journal || publisher}.`
        case CitationStyle.MLA:
          return `${authors}. "${title}." ${journal || publisher}, ${publicationDate}.`
        default:
          return `${authors}. ${publicationDate}. ${title}.`
      }
    }).join('\n\n')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateBibliography())
      // In a real app, you'd show a toast notification here
      console.log('Bibliography copied to clipboard')
    } catch (error) {
      console.error('Failed to copy bibliography:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Bibliography Generator
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Citation Style</label>
          <Select value={citationStyle} onValueChange={handleStyleChange}>
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

        <div>
          <label className="text-sm font-medium mb-2 block">Export Format</label>
          <Select value={selectedFormat} onValueChange={handleFormatChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Plain Text</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          Copy to Clipboard
        </Button>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Bibliography
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Generated Bibliography ({references.length} references)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {generateBibliography()}
            </pre>
          </div>
        </CardContent>
      </Card>

      {references.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No references available.</p>
          <p className="text-sm">Add some references to generate a bibliography.</p>
        </div>
      )}
    </div>
  )
}
