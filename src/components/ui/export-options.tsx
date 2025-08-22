"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Checkbox } from "./shadcn/checkbox"
import { Label } from "./shadcn/label"
import { CitationStyle } from "../../lib/ai-types"
import { Download, Settings } from "lucide-react"

interface ExportOptionsProps {
  citationStyle?: CitationStyle
  onExport?: (options: ExportOptions) => void
}

export interface ExportOptions {
  format: 'bibtex' | 'ris' | 'json' | 'csv'
  citationStyle: CitationStyle
  includeNotes: boolean
  includeTags: boolean
  includeAbstract: boolean
  includeDOI: boolean
}

export const ExportOptionsComponent: React.FC<ExportOptionsProps> = ({
  citationStyle = CitationStyle.APA,
  onExport
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'bibtex',
    citationStyle,
    includeNotes: true,
    includeTags: true,
    includeAbstract: false,
    includeDOI: true
  })

  const handleOptionChange = (key: keyof ExportOptions, value: boolean | string) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExport = (format: 'bibtex' | 'ris' | 'json' | 'csv') => {
    const exportOptions = { ...options, format }
    if (onExport) {
      onExport(exportOptions)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        <h3 className="text-lg font-semibold">Export Options</h3>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-notes"
            checked={options.includeNotes}
            onCheckedChange={(checked) => handleOptionChange('includeNotes', checked as boolean)}
          />
          <Label htmlFor="include-notes">Include notes</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-tags"
            checked={options.includeTags}
            onCheckedChange={(checked) => handleOptionChange('includeTags', checked as boolean)}
          />
          <Label htmlFor="include-tags">Include tags</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-abstract"
            checked={options.includeAbstract}
            onCheckedChange={(checked) => handleOptionChange('includeAbstract', checked as boolean)}
          />
          <Label htmlFor="include-abstract">Include abstracts</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-doi"
            checked={options.includeDOI}
            onCheckedChange={(checked) => handleOptionChange('includeDOI', checked as boolean)}
          />
          <Label htmlFor="include-doi">Include DOI links</Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('bibtex')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export BibTeX
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('ris')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export RIS
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('json')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>
  )
}
