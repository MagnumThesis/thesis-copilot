"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Separator } from "./shadcn/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Reference, CitationStyle } from "../../lib/ai-types"
import { Download, Upload, FileText, Copy, Share2, Archive, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ReferenceExportProps {
  references: Reference[]
  currentCitationStyle: CitationStyle
  onImport: (references: Reference[]) => void
  className?: string
}

interface ExportFormat {
  id: string
  name: string
  extension: string
  description: string
}

export const ReferenceExport: React.FC<ReferenceExportProps> = ({
  references,
  currentCitationStyle,
  onImport,
  className = ''
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('bibtex')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const exportFormats: ExportFormat[] = [
    {
      id: 'bibtex',
      name: 'BibTeX',
      extension: '.bib',
      description: 'Standard academic database format'
    },
    {
      id: 'ris',
      name: 'RIS',
      extension: '.ris',
      description: 'Research Information Systems format'
    },
    {
      id: 'endnote',
      name: 'EndNote',
      extension: '.enw',
      description: 'EndNote reference manager format'
    },
    {
      id: 'zotero',
      name: 'Zotero RDF',
      extension: '.rdf',
      description: 'Zotero open-source format'
    },
    {
      id: 'json',
      name: 'JSON',
      extension: '.json',
      description: 'Machine-readable format'
    },
    {
      id: 'csv',
      name: 'CSV',
      extension: '.csv',
      description: 'Comma-separated values'
    }
  ]

  const handleExport = async (format: string) => {
    if (references.length === 0) {
      toast.error('No references to export')
      return
    }

    setIsExporting(true)

    try {
      const exportFormat = exportFormats.find(f => f.id === format)
      if (!exportFormat) {
        throw new Error('Unknown export format')
      }

      const response = await fetch('/api/referencer/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          references,
          format,
          citationStyle: currentCitationStyle
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `references${exportFormat.extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
      toast.success(`Exported ${references.length} references as ${exportFormat.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/referencer/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const { references: importedReferences, errors } = await response.json()

      if (importedReferences.length > 0) {
        onImport(importedReferences)
        toast.success(`Imported ${importedReferences.length} references`)
      }

      if (errors.length > 0) {
        toast.warning(`${errors.length} references could not be imported`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleCopyToClipboard = async () => {
    if (references.length === 0) {
      toast.error('No references to copy')
      return
    }

    try {
      const response = await fetch('/api/referencer/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          references,
          format: 'bibtex',
          citationStyle: currentCitationStyle
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate export')
      }

      const text = await response.text()
      await navigator.clipboard.writeText(text)
      toast.success('References copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy references')
    }
  }

  const handleShare = async () => {
    if (references.length === 0) {
      toast.error('No references to share')
      return
    }

    try {
      const shareData = {
        title: 'Academic References',
        text: `Sharing ${references.length} academic references`,
        url: window.location.href
      }

      if (navigator.share) {
        await navigator.share(shareData)
        toast.success('Shared successfully')
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch (error) {
      toast.error('Sharing failed')
    }
  }

  const handleBackup = async () => {
    if (references.length === 0) {
      toast.error('No references to backup')
      return
    }

    setIsExporting(true)

    try {
      const response = await fetch('/api/referencer/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          references,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Backup failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `references-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
      toast.success('Backup created successfully')
    } catch (error) {
      toast.error('Backup failed')
    } finally {
      setIsExporting(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const estimatedExportSize = JSON.stringify(references).length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Export & Import</h3>
          <Badge variant="outline" className="text-xs">
            {references.length} references
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Export Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Export References</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport('bibtex')}
                  disabled={isExporting || references.length === 0}
                  className="flex-1"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  BibTeX
                </Button>
                <Button
                  onClick={handleCopyToClipboard}
                  disabled={references.length === 0}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleShare}
                disabled={references.length === 0}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Advanced Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportFormats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{format.name}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {format.extension}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-xs text-muted-foreground">
                Estimated size: {formatFileSize(estimatedExportSize)}
              </div>

              <Button
                onClick={() => handleExport(selectedFormat)}
                disabled={isExporting || references.length === 0}
                className="w-full"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export as {exportFormats.find(f => f.id === selectedFormat)?.name}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Import Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Import References</h4>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a file to import references
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports: BibTeX, RIS, JSON, CSV
                </p>
                <input
                  type="file"
                  accept=".bib,.ris,.json,.csv,.enw,.rdf"
                  onChange={handleImport}
                  className="hidden"
                  id="file-upload"
                  disabled={isImporting}
                />
                <label htmlFor="file-upload">
                  <Button
                    asChild
                    disabled={isImporting}
                    size="sm"
                  >
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {isImporting ? 'Importing...' : 'Choose File'}
                    </span>
                  </Button>
                </label>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="space-y-1">
                  <li>• BibTeX (.bib) - Academic database format</li>
                  <li>• RIS (.ris) - Research Information Systems</li>
                  <li>• JSON (.json) - Machine-readable format</li>
                  <li>• CSV (.csv) - Comma-separated values</li>
                  <li>• EndNote (.enw) - EndNote format</li>
                  <li>• Zotero RDF (.rdf) - Zotero format</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Backup & Management */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Backup & Management</h4>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleBackup}
            disabled={isExporting || references.length === 0}
            variant="outline"
            size="sm"
          >
            <Archive className="h-4 w-4 mr-2" />
            Create Backup
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>💡 Tip: Regular backups help prevent data loss</p>
        </div>
      </div>
    </div>
  )
}
