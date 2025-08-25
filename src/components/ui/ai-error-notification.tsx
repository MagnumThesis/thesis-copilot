"use client";

import React from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/shadcn/alert";
import {
  AlertTriangle,
  Wifi,
  Clock,
  Server,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIError, AIErrorType, AIErrorHandler } from "@/lib/ai-infrastructure";

interface AIErrorNotificationProps {
  error: AIError;
  onRetry?: () => void;
  onDismiss: () => void;
  onGracefulDegradation?: () => void;
  canRetry?: boolean;
  retryCount?: number;
  className?: string;
}

const errorIcons = {
  [AIErrorType.NETWORK_ERROR]: Wifi,
  [AIErrorType.TIMEOUT_ERROR]: Clock,
  [AIErrorType.SERVICE_UNAVAILABLE]: Server,
  [AIErrorType.API_ERROR]: Server,
  [AIErrorType.RATE_LIMIT_ERROR]: Clock,
  [AIErrorType.AUTHENTICATION_ERROR]: AlertTriangle,
  [AIErrorType.QUOTA_EXCEEDED]: AlertTriangle,
  [AIErrorType.VALIDATION_ERROR]: AlertTriangle,
  [AIErrorType.CONTEXT_ERROR]: AlertTriangle,
  [AIErrorType.CONTENT_FILTER_ERROR]: AlertTriangle,
  [AIErrorType.OPERATION_CANCELLED]: X,
  [AIErrorType.UNKNOWN_ERROR]: AlertTriangle,
};

const errorVariants = {
  [AIErrorType.NETWORK_ERROR]: "default",
  [AIErrorType.TIMEOUT_ERROR]: "default",
  [AIErrorType.SERVICE_UNAVAILABLE]: "destructive",
  [AIErrorType.API_ERROR]: "destructive",
  [AIErrorType.RATE_LIMIT_ERROR]: "default",
  [AIErrorType.AUTHENTICATION_ERROR]: "destructive",
  [AIErrorType.QUOTA_EXCEEDED]: "destructive",
  [AIErrorType.VALIDATION_ERROR]: "default",
  [AIErrorType.CONTEXT_ERROR]: "default",
  [AIErrorType.CONTENT_FILTER_ERROR]: "default",
  [AIErrorType.OPERATION_CANCELLED]: "default",
  [AIErrorType.UNKNOWN_ERROR]: "destructive",
} as const;

/**
 * A component to display AI-related error notifications with options for retry, graceful degradation, and detailed error information.
 * It categorizes errors by type and provides user-friendly messages and recovery actions.
 * @param {AIErrorNotificationProps} props - The properties for the AIErrorNotification component.
 * @param {AIError} props.error - The AIError object containing details about the error.
 * @param {() => void} [props.onRetry] - Callback function to be called when the retry button is clicked.
 * @param {() => void} props.onDismiss - Callback function to be called when the notification is dismissed.
 * @param {() => void} [props.onGracefulDegradation] - Callback function to be called when graceful degradation is triggered.
 * @param {boolean} [props.canRetry=false] - Indicates whether the error is retryable.
 * @param {number} [props.retryCount=0] - The current retry attempt count.
 * @param {string} [props.className] - Additional CSS classes to apply to the notification container.
 * @example
 * ```tsx
 * import { AIError, AIErrorType } from "@/lib/ai-infrastructure";
 *
 * const sampleError: AIError = {
 *   type: AIErrorType.NETWORK_ERROR,
 *   message: "Failed to connect to the AI service.",
 *   code: "NET_001",
 *   retryable: true,
 * };
 *
 * <AIErrorNotification
 *   error={sampleError}
 *   onDismiss={() => console.log('Dismissed')}
 *   onRetry={() => console.log('Retrying...')}
 *   canRetry={true}
 *   retryCount={1}
 * />
 * ```
 */
export const AIErrorNotification: React.FC<AIErrorNotificationProps> = ({
  error,
  onRetry,
  onDismiss,
  onGracefulDegradation,
  canRetry = false,
  retryCount = 0,
  className,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const Icon = errorIcons[error.type] || AlertTriangle;
  const variant = errorVariants[error.type] || "default";
  const recoveryStrategy = AIErrorHandler.getRetryStrategy(error);
  const userFriendlyMessage = AIErrorHandler.getUserFriendlyMessage(error);

  const getErrorTitle = (errorType: AIErrorType): string => {
    switch (errorType) {
      case AIErrorType.NETWORK_ERROR:
        return "Connection Issue";
      case AIErrorType.TIMEOUT_ERROR:
        return "Request Timeout";
      case AIErrorType.SERVICE_UNAVAILABLE:
        return "Service Unavailable";
      case AIErrorType.API_ERROR:
        return "AI Service Error";
      case AIErrorType.RATE_LIMIT_ERROR:
        return "Rate Limited";
      case AIErrorType.AUTHENTICATION_ERROR:
        return "Authentication Error";
      case AIErrorType.QUOTA_EXCEEDED:
        return "Quota Exceeded";
      case AIErrorType.VALIDATION_ERROR:
        return "Input Error";
      case AIErrorType.CONTEXT_ERROR:
        return "Context Error";
      case AIErrorType.CONTENT_FILTER_ERROR:
        return "Content Filtered";
      case AIErrorType.OPERATION_CANCELLED:
        return "Operation Cancelled";
      default:
        return "Unexpected Error";
    }
  };

  const shouldShowRetryButton = canRetry && recoveryStrategy.showRetryButton && onRetry;
  const shouldShowGracefulDegradation = recoveryStrategy.gracefulDegradation && onGracefulDegradation;

  return (
    <Alert variant={variant} className={cn("relative", className)}>
      <Icon className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="flex items-center justify-between">
          <span>{getErrorTitle(error.type)}</span>
          <div className="flex items-center gap-2">
            {shouldShowRetryButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 px-2 text-xs"
                disabled={retryCount >= (recoveryStrategy.retryAttempts || 0)}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry {retryCount > 0 && `(${retryCount})`}
              </Button>
            )}
            {shouldShowGracefulDegradation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGracefulDegradation}
                className="h-7 px-2 text-xs"
              >
                Continue Manually
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p>{userFriendlyMessage}</p>
            
            {error.retryable && retryCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Retry attempt {retryCount} of {recoveryStrategy.retryAttempts}
              </p>
            )}
            
            {error.code && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showDetails ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show Details
                  </>
                )}
              </Button>
            )}
            
            {showDetails && (
              <div className="mt-2 p-2 bg-muted rounded text-xs font-mono space-y-1">
                <div><strong>Error Code:</strong> {error.code}</div>
                <div><strong>Type:</strong> {error.type}</div>
                <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
                {error.originalError && (
                  <div><strong>Details:</strong> {error.originalError.message}</div>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};