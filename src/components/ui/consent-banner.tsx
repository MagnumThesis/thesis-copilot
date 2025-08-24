"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Separator } from "./shadcn/separator"
import { Shield, Info, Settings, CheckCircle, X } from "lucide-react"
import { usePrivacyManager } from "../../hooks/usePrivacyManager"
import { useToast } from "../../hooks/use-toast"

interface ConsentBannerProps {
  conversationId?: string
  onConsentChange?: (granted: boolean) => void
  showDetailedOptions?: boolean
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  conversationId,
  onConsentChange,
  showDetailedOptions = false
}) => {
  const { toast } = useToast()
  const privacyManager = usePrivacyManager(conversationId)
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(showDetailedOptions)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Show banner if user hasn't given consent yet
    if (privacyManager.settings && !privacyManager.hasConsent) {
      setShowBanner(true)
    } else {
      setShowBanner(false)
    }
  }, [privacyManager.settings, privacyManager.hasConsent])

  const handleAcceptAll = async () => {
    try {
      setProcessing(true)
      await privacyManager.updateSettings({
        consentGiven: true,
        analyticsEnabled: true,
        learningEnabled: true,
        consentDate: new Date()
      })

      setShowBanner(false)
      onConsentChange?.(true)

      toast({
        title: "Consent Granted",
        description: "Thank you! AI features are now enabled with full functionality.",
      })
    } catch (error) {
      console.error('Error accepting consent:', error)
      toast({
        title: "Error",
        description: "Failed to save consent preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleAcceptEssential = async () => {
    try {
      setProcessing(true)
      await privacyManager.updateSettings({
        consentGiven: true,
        analyticsEnabled: false,
        learningEnabled: false,
        consentDate: new Date()
      })

      setShowBanner(false)
      onConsentChange?.(true)

      toast({
        title: "Essential Consent Granted",
        description: "AI search is enabled with basic functionality only.",
      })
    } catch (error) {
      console.error('Error accepting essential consent:', error)
      toast({
        title: "Error",
        description: "Failed to save consent preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      setProcessing(true)
      await privacyManager.updateSettings({
        consentGiven: false,
        analyticsEnabled: false,
        learningEnabled: false,
        consentDate: undefined
      })

      setShowBanner(false)
      onConsentChange?.(false)

      toast({
        title: "Consent Declined",
        description: "AI search features are disabled. You can change this in privacy settings.",
      })
    } catch (error) {
      console.error('Error rejecting consent:', error)
      toast({
        title: "Error",
        description: "Failed to save consent preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleCustomSettings = async (analytics: boolean, learning: boolean) => {
    try {
      setProcessing(true)
      await privacyManager.updateSettings({
        consentGiven: true,
        analyticsEnabled: analytics,
        learningEnabled: learning,
        consentDate: new Date()
      })

      setShowBanner(false)
      onConsentChange?.(true)

      toast({
        title: "Custom Consent Saved",
        description: "Your privacy preferences have been saved successfully.",
      })
    } catch (error) {
      console.error('Error saving custom consent:', error)
      toast({
        title: "Error",
        description: "Failed to save consent preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (!showBanner || privacyManager.hasConsent) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto">
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Privacy & Data Consent</h3>
                  <p className="text-sm text-muted-foreground">
                    We need your consent to provide AI-powered reference search features
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main content */}
            <div className="space-y-3">
              <p className="text-sm">
                Our AI Reference Searcher can help you find relevant academic papers by analyzing your content 
                and learning from your feedback. To provide this service, we need to:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Store search history</span>
                    <p className="text-muted-foreground">Track your searches to improve results</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Analyze usage patterns</span>
                    <p className="text-muted-foreground">Understand what works best for you</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Learn from feedback</span>
                    <p className="text-muted-foreground">Improve suggestions based on your ratings</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">Process content</span>
                    <p className="text-muted-foreground">Analyze your Ideas and Builder content</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed options */}
            {showDetails && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Detailed Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ConsentOption
                      title="Analytics & Usage Tracking"
                      description="Track search patterns and success rates to provide insights and improve the service"
                      defaultEnabled={true}
                      onToggle={(enabled) => {
                        // Handle individual option toggle if needed
                      }}
                    />
                    <ConsentOption
                      title="AI Learning System"
                      description="Learn from your feedback to personalize and improve future search results"
                      defaultEnabled={true}
                      onToggle={(enabled) => {
                        // Handle individual option toggle if needed
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="flex gap-2 flex-1">
                <Button
                  onClick={handleAcceptAll}
                  disabled={processing}
                  className="flex-1 sm:flex-none"
                >
                  {processing ? 'Processing...' : 'Accept All'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAcceptEssential}
                  disabled={processing}
                  className="flex-1 sm:flex-none"
                >
                  Essential Only
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(!showDetails)}
                  disabled={processing}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showDetails ? 'Hide' : 'Customize'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleReject}
                  disabled={processing}
                >
                  Decline
                </Button>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Your privacy matters</p>
                <p>
                  You can change these settings anytime, export your data, or delete it completely. 
                  We follow GDPR guidelines and never share your data with third parties.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ConsentOptionProps {
  title: string
  description: string
  defaultEnabled: boolean
  onToggle: (enabled: boolean) => void
}

const ConsentOption: React.FC<ConsentOptionProps> = ({
  title,
  description,
  defaultEnabled,
  onToggle
}) => {
  const [enabled, setEnabled] = useState(defaultEnabled)

  const handleToggle = () => {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    onToggle(newEnabled)
  }

  return (
    <div className="p-3 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h5 className="font-medium text-sm">{title}</h5>
            <Badge variant={enabled ? "default" : "secondary"} className="text-xs">
              {enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="ml-2 flex-shrink-0"
        >
          {enabled ? 'Disable' : 'Enable'}
        </Button>
      </div>
    </div>
  )
}