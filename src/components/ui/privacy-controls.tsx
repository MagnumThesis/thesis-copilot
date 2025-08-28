"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Label } from "./shadcn/label"
import { Switch } from "./shadcn/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { Separator } from "./shadcn/separator"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./shadcn/alert-dialog"
import { Shield, Trash2, Download, Settings, Clock, Database, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { useToast } from "../../hooks/use-toast"
import { getClientId } from "../../utils/client-id-manager"

export interface PrivacySettings {
  dataRetentionDays: number
  autoDeleteEnabled: boolean
  analyticsEnabled: boolean
  learningEnabled: boolean
  exportFormat: 'json' | 'csv'
  consentGiven: boolean
  consentDate?: Date
}

export interface DataSummary {
  searchSessions: number
  searchResults: number
  feedbackEntries: number
  learningData: number
  totalSize: string
  oldestEntry?: Date
  newestEntry?: Date
}

interface PrivacyControlsProps {
  conversationId?: string
  onSettingsChange?: (settings: PrivacySettings) => void
  onDataCleared?: () => void
  onDataExported?: (data: any) => void
}

/**
 * @component PrivacyControls
 * @description A comprehensive component for managing user privacy settings and data within the application.
 * It allows users to control data collection consent, set data retention periods, enable/disable analytics and AI learning, and manage their stored data (export, clear old, clear all).
 * @param {PrivacyControlsProps} props - The properties for the PrivacyControls component.
 * @param {string} [props.conversationId] - Optional ID of the current conversation, used for context-specific data management.
 * @param {(settings: PrivacySettings) => void} [props.onSettingsChange] - Callback function triggered when privacy settings are updated.
 * @param {() => void} [props.onDataCleared] - Callback function triggered after data has been successfully cleared.
 * @param {(data: any) => void} [props.onDataExported] - Callback function triggered after data has been successfully exported, providing the exported data.
 */
export const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  conversationId,
  onSettingsChange,
  onDataCleared,
  onDataExported
}) => {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PrivacySettings>({
    dataRetentionDays: 365,
    autoDeleteEnabled: false,
    analyticsEnabled: true,
    learningEnabled: true,
    exportFormat: 'json',
    consentGiven: false
  })
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [exportingData, setExportingData] = useState(false)

  // Get client ID for all API calls
  const clientId = getClientId()

  useEffect(() => {
    loadPrivacySettings()
    loadDataSummary()
  }, [conversationId])

  const loadPrivacySettings = async () => {
    try {
      const response = await fetch(`/api/ai-searcher/privacy/settings${conversationId ? `?conversationId=${conversationId}` : ''}`, {
        headers: {
          'x-user-id': clientId
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings({
            ...data.settings,
            consentDate: data.settings.consentDate ? new Date(data.settings.consentDate) : undefined
          })
        }
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error)
    }
  }

  const loadDataSummary = async () => {
    try {
      const response = await fetch(`/api/ai-searcher/privacy/data-summary${conversationId ? `?conversationId=${conversationId}` : ''}`, {
        headers: {
          'x-user-id': clientId
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.summary) {
          setDataSummary({
            ...data.summary,
            oldestEntry: data.summary.oldestEntry ? new Date(data.summary.oldestEntry) : undefined,
            newestEntry: data.summary.newestEntry ? new Date(data.summary.newestEntry) : undefined
          })
        }
      }
    } catch (error) {
      console.error('Error loading data summary:', error)
    }
  }

  const updateSettings = async (newSettings: Partial<PrivacySettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)

    try {
      setLoading(true)
      const response = await fetch('/api/ai-searcher/privacy/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': clientId
        },
        body: JSON.stringify({
          settings: updatedSettings,
          conversationId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update privacy settings')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update privacy settings')
      }

      onSettingsChange?.(updatedSettings)
      
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved successfully.",
      })
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      })
      // Revert settings on error
      loadPrivacySettings()
    } finally {
      setLoading(false)
    }
  }

  const handleConsentChange = (granted: boolean) => {
    updateSettings({
      consentGiven: granted,
      consentDate: granted ? new Date() : undefined,
      analyticsEnabled: granted ? settings.analyticsEnabled : false,
      learningEnabled: granted ? settings.learningEnabled : false
    })
  }

  const clearAllData = async () => {
    try {
      setClearingData(true)
      const response = await fetch('/api/ai-searcher/privacy/clear-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': clientId
        },
        body: JSON.stringify({
          conversationId,
          clearAll: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to clear data')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to clear data')
      }

      // Refresh data summary
      await loadDataSummary()
      onDataCleared?.()

      toast({
        title: "Data Cleared",
        description: `Successfully cleared ${data.deletedCount || 'all'} records.`,
      })
    } catch (error) {
      console.error('Error clearing data:', error)
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClearingData(false)
    }
  }

  const clearOldData = async () => {
    try {
      setClearingData(true)
      const response = await fetch('/api/ai-searcher/privacy/clear-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': clientId
        },
        body: JSON.stringify({
          conversationId,
          retentionDays: settings.dataRetentionDays
        })
      })

      if (!response.ok) {
        throw new Error('Failed to clear old data')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to clear old data')
      }

      // Refresh data summary
      await loadDataSummary()

      toast({
        title: "Old Data Cleared",
        description: `Successfully cleared ${data.deletedCount || 0} old records.`,
      })
    } catch (error) {
      console.error('Error clearing old data:', error)
      toast({
        title: "Error",
        description: "Failed to clear old data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClearingData(false)
    }
  }

  const exportData = async () => {
    try {
      setExportingData(true)
      const response = await fetch('/api/ai-searcher/privacy/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': clientId
        },
        body: JSON.stringify({
          conversationId,
          format: settings.exportFormat
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to export data')
      }

      // Create and download file
      const blob = new Blob([data.exportData], { 
        type: settings.exportFormat === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `search-history-${new Date().toISOString().split('T')[0]}.${settings.exportFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onDataExported?.(data.exportData)

      toast({
        title: "Data Exported",
        description: `Successfully exported ${data.recordCount || 0} records.`,
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setExportingData(false)
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getRetentionDescription = (days: number) => {
    if (days <= 30) return 'Short-term (recommended for privacy)'
    if (days <= 90) return 'Medium-term (balanced approach)'
    if (days <= 365) return 'Long-term (better analytics)'
    return 'Extended (maximum data retention)'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Privacy & Data Management</h3>
      </div>

      {/* Consent Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Data Processing Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Allow AI search data collection and processing</Label>
              <p className="text-sm text-muted-foreground">
                Enable collection of search history, analytics, and learning data to improve your experience
              </p>
            </div>
            <Switch
              checked={settings.consentGiven}
              onCheckedChange={handleConsentChange}
              disabled={loading}
            />
          </div>
          
          {settings.consentGiven && settings.consentDate && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Consent granted on {formatDate(settings.consentDate)}
                </span>
              </div>
            </div>
          )}

          {!settings.consentGiven && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  Analytics and learning features are disabled without consent
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Data Retention Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data Retention Period</Label>
            <Select
              value={settings.dataRetentionDays.toString()}
              onValueChange={(value) => updateSettings({ dataRetentionDays: parseInt(value) })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getRetentionDescription(settings.dataRetentionDays)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Automatic cleanup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically delete data older than retention period
              </p>
            </div>
            <Switch
              checked={settings.autoDeleteEnabled}
              onCheckedChange={(checked) => updateSettings({ autoDeleteEnabled: checked })}
              disabled={loading || !settings.consentGiven}
            />
          </div>

          {settings.autoDeleteEnabled && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  Data older than {settings.dataRetentionDays} days will be automatically deleted
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Feature Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Analytics tracking</Label>
              <p className="text-sm text-muted-foreground">
                Track search patterns and success rates for insights
              </p>
            </div>
            <Switch
              checked={settings.analyticsEnabled}
              onCheckedChange={(checked) => updateSettings({ analyticsEnabled: checked })}
              disabled={loading || !settings.consentGiven}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>AI learning system</Label>
              <p className="text-sm text-muted-foreground">
                Learn from your feedback to improve future search results
              </p>
            </div>
            <Switch
              checked={settings.learningEnabled}
              onCheckedChange={(checked) => updateSettings({ learningEnabled: checked })}
              disabled={loading || !settings.consentGiven}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Summary */}
      {dataSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Your Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Search Sessions</Label>
                <Badge variant="secondary">{dataSummary.searchSessions}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Search Results</Label>
                <Badge variant="secondary">{dataSummary.searchResults}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Feedback Entries</Label>
                <Badge variant="secondary">{dataSummary.feedbackEntries}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Learning Data</Label>
                <Badge variant="secondary">{dataSummary.learningData}</Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total storage size:</span>
                <span className="font-medium">{dataSummary.totalSize}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Oldest entry:</span>
                <span>{formatDate(dataSummary.oldestEntry)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Newest entry:</span>
                <span>{formatDate(dataSummary.newestEntry)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Export your data</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your search history and analytics data
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value: 'json' | 'csv') => updateSettings({ exportFormat: value })}
                  disabled={exportingData}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={exportData}
                  disabled={exportingData || !dataSummary || dataSummary.searchSessions === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {exportingData ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Clear Old Data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Clear old data</Label>
                <p className="text-sm text-muted-foreground">
                  Remove data older than {settings.dataRetentionDays} days
                </p>
              </div>
              <Button
                variant="outline"
                onClick={clearOldData}
                disabled={clearingData || !dataSummary || dataSummary.searchSessions === 0}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                {clearingData ? 'Clearing...' : 'Clear Old Data'}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Clear All Data */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-red-600">Clear all data</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all your search history and analytics data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={clearingData || !dataSummary || dataSummary.searchSessions === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Clear All Data
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all your search history, analytics data, 
                      feedback, and learning patterns. This cannot be undone.
                      <br /><br />
                      <strong>Data to be deleted:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>{dataSummary?.searchSessions || 0} search sessions</li>
                        <li>{dataSummary?.searchResults || 0} search results</li>
                        <li>{dataSummary?.feedbackEntries || 0} feedback entries</li>
                        <li>{dataSummary?.learningData || 0} learning data points</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearAllData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {clearingData ? 'Clearing...' : 'Delete All Data'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}