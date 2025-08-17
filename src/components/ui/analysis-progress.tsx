"use client"

import React from "react"
import { Button } from "@/components/ui/shadcn/button"
import { Progress } from "@/components/ui/shadcn/progress"
import { Badge } from "@/components/ui/shadcn/badge"
import { Loader2, X, CheckCircle, AlertCircle, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalysisProgressProps {
  isAnalyzing: boolean
  progress: number
  statusMessage: string
  onCancel: () => void
  error?: string | null
  success?: boolean
  onRetry?: () => void
  onDismissError?: () => void
  isOnline?: boolean
  fallbackUsed?: boolean
  cacheUsed?: boolean
  errorType?: string
  recoveryOptions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }>
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  isAnalyzing,
  progress,
  statusMessage,
  onCancel,
  error,
  success,
  onRetry,
  onDismissError,
  isOnline = true,
  fallbackUsed = false,
  cacheUsed = false,
  errorType,
  recoveryOptions = []
}) => {
  if (!isAnalyzing && !error && !success) {
    return null
  }

  return (
    <div className={cn(
      "p-4 border rounded-md",
      error && "border-red-200 bg-red-50",
      success && "border-green-200 bg-green-50",
      isAnalyzing && "border-blue-200 bg-blue-50"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
          <span className={cn(
            "text-sm font-medium",
            error && "text-red-800",
            success && "text-green-800",
            isAnalyzing && "text-blue-800"
          )}>
            {error ? "Analysis Failed" : success ? "Analysis Complete" : "Analyzing Content"}
          </span>
          
          {/* Status badges */}
          <div className="flex gap-1">
            {!isOnline && (
              <Badge variant="outline" className="text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            {fallbackUsed && (
              <Badge variant="secondary" className="text-xs">
                Basic Mode
              </Badge>
            )}
            {cacheUsed && (
              <Badge variant="outline" className="text-xs">
                Cached
              </Badge>
            )}
            {errorType && (
              <Badge variant="destructive" className="text-xs">
                {errorType}
              </Badge>
            )}
          </div>
        </div>
        
        {isAnalyzing && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="mb-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{Math.round(progress)}% complete</span>
            <span>Please wait...</span>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className={cn(
        "text-sm",
        error && "text-red-700",
        success && "text-green-700",
        isAnalyzing && "text-blue-700"
      )}>
        {error ? (
          <div>
            <p className="font-medium">Error: {error}</p>
            <p className="text-xs mt-1 text-red-600">
              Please try again or check your connection.
            </p>
          </div>
        ) : (
          statusMessage
        )}
      </div>

      {/* Analysis Steps */}
      {isAnalyzing && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              progress > 0 ? "bg-blue-600" : "bg-gray-300"
            )} />
            <span className={progress > 0 ? "text-blue-700" : ""}>
              Retrieving content
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              progress > 25 ? "bg-blue-600" : "bg-gray-300"
            )} />
            <span className={progress > 25 ? "text-blue-700" : ""}>
              Loading idea definitions
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              progress > 50 ? "bg-blue-600" : "bg-gray-300"
            )} />
            <span className={progress > 50 ? "text-blue-700" : ""}>
              Analyzing content structure
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              progress > 75 ? "bg-blue-600" : "bg-gray-300"
            )} />
            <span className={progress > 75 ? "text-blue-700" : ""}>
              Generating concerns
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              progress >= 100 ? "bg-green-600" : "bg-gray-300"
            )} />
            <span className={progress >= 100 ? "text-green-700" : ""}>
              Finalizing results
            </span>
          </div>
        </div>
      )}

      {/* Success Actions */}
      {success && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      )}

      {/* Error Actions */}
      {error && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onDismissError || onCancel}
              className="text-xs"
            >
              Dismiss
            </Button>
            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            
            {/* Custom recovery options */}
            {recoveryOptions.map((option, index) => (
              <Button
                key={index}
                size="sm"
                variant={option.variant || "outline"}
                onClick={option.action}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          {/* Error-specific guidance */}
          {errorType && (
            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs">
              {errorType === 'network_error' && (
                <div>
                  <p className="font-medium text-red-800">Network Connection Issue</p>
                  <p className="text-red-600 mt-1">
                    • Check your internet connection<br/>
                    • Try offline analysis mode<br/>
                    • Changes will sync when connection is restored
                  </p>
                </div>
              )}
              {errorType === 'ai_service_error' && (
                <div>
                  <p className="font-medium text-red-800">AI Service Unavailable</p>
                  <p className="text-red-600 mt-1">
                    • AI service may be temporarily down<br/>
                    • Try basic analysis mode<br/>
                    • Full analysis will be available when service is restored
                  </p>
                </div>
              )}
              {errorType === 'rate_limit_error' && (
                <div>
                  <p className="font-medium text-red-800">Rate Limit Exceeded</p>
                  <p className="text-red-600 mt-1">
                    • Too many requests in a short time<br/>
                    • Wait a few minutes before retrying<br/>
                    • Consider analyzing smaller sections
                  </p>
                </div>
              )}
              {errorType === 'content_error' && (
                <div>
                  <p className="font-medium text-red-800">Content Issue</p>
                  <p className="text-red-600 mt-1">
                    • Check that your document has sufficient content<br/>
                    • Ensure content is properly formatted<br/>
                    • Add more content in the Builder tool
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}