"use client"

import React from "react"
import { Button } from "@/components/ui/shadcn/button"
import { Progress } from "@/components/ui/shadcn/progress"
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react"
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
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  isAnalyzing,
  progress,
  statusMessage,
  onCancel,
  error,
  success,
  onRetry,
  onDismissError
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
        <div className="mt-3 flex gap-2">
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
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  )
}