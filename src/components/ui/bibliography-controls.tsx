"use client"

import React from "react"
import { Button } from "./shadcn/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { CitationStyle } from "../../lib/ai-types"
import { Download } from "lucide-react"

interface BibliographyControlsProps {
  citationStyle?: CitationStyle
  onStyleChange?: (style: CitationStyle) => void
  onExport?: (format: 'bibtex' | 'ris' | 'json' | 'csv') => void
}

export const BibliographyControls: React.FC<BibliographyControlsProps> = ({
  citationStyle = CitationStyle.APA,
  onStyleChange,
  onExport
}) => {
  const handleStyleChange = (value: string) => {
    if (onStyleChange) {
      onStyleChange(value as CitationStyle)
    }
  }

  const handleExport = (format: 'bibtex' | 'ris' | 'json' | 'csv') => {
    if (onExport) {
      onExport(format)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bibliography Controls</h3>
        <div className="flex items-center gap-2">
          <Select value={citationStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-32">
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
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('bibtex')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          BibTeX
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('ris')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          RIS
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('json')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>
    </div>
  )
}
