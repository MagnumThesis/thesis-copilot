"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { ModificationType } from "@/lib/ai-types";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
} from "lucide-react";

interface AIContentPreviewProps {
  originalText: string;
  modifiedText: string;
  modificationType: ModificationType;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate?: () => void;
  isVisible: boolean;
  isRegenerating?: boolean;
  className?: string;
}

const modificationTypeLabels: Record<ModificationType, string> = {
  [ModificationType.PROMPT]: "Custom Modified",
  [ModificationType.EXPAND]: "Expanded",
  [ModificationType.SHORTEN]: "Shortened",
  [ModificationType.REPHRASE]: "Rephrased",
  [ModificationType.CORRECT]: "Corrected",
  [ModificationType.TONE]: "Tone Adjusted",
  [ModificationType.FORMAT]: "Formatted",
  [ModificationType.REWRITE]: "Rewritten",
  [ModificationType.SUMMARIZE]: "Summarized",
  [ModificationType.IMPROVE_CLARITY]: "Clarity Improved",
};

export const AIContentPreview: React.FC<AIContentPreviewProps> = ({
  originalText,
  modifiedText,
  modificationType,
  onAccept,
  onReject,
  onRegenerate,
  isVisible,
  isRegenerating = false,
  className,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  if (!isVisible) return null;

  const handleAccept = () => {
    if (isRegenerating) return;
    onAccept();
  };

  const handleReject = () => {
    if (isRegenerating) return;
    onReject();
  };

  const handleRegenerate = () => {
    if (isRegenerating || !onRegenerate) return;
    onRegenerate();
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(modifiedText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.warn("Failed to copy to clipboard:", error);
    }
  };

  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };

  return (
    <div
      className={cn(
        "bg-background border rounded-lg shadow-lg p-4 space-y-4 min-w-96 max-w-2xl",
        className
      )}
      role="dialog"
      aria-label="AI content preview"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">
            {modificationTypeLabels[modificationType]} Content
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Comparison toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleComparison}
                disabled={isRegenerating}
                className="h-8 w-8 p-0"
                aria-label={showComparison ? "Hide comparison" : "Show comparison"}
              >
                {showComparison ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showComparison ? "Hide comparison" : "Show original vs modified"}
            </TooltipContent>
          </Tooltip>

          {/* Copy to clipboard */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={isRegenerating}
                className="h-8 w-8 p-0"
                aria-label="Copy modified text"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copiedToClipboard ? "Copied!" : "Copy to clipboard"}
            </TooltipContent>
          </Tooltip>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            disabled={isRegenerating}
            className="h-8 w-8 p-0"
            aria-label="Close preview"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content preview */}
      <div className="space-y-3">
        {showComparison ? (
          /* Side-by-side comparison */
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Original
              </div>
              <div className="bg-muted/50 rounded p-3 text-sm border-l-2 border-muted-foreground/20">
                <div className="whitespace-pre-wrap">{originalText}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-primary">
                {modificationTypeLabels[modificationType]}
              </div>
              <div className="bg-primary/5 rounded p-3 text-sm border-l-2 border-primary">
                <div className="whitespace-pre-wrap">{modifiedText}</div>
              </div>
            </div>
          </div>
        ) : (
          /* Modified content only */
          <div className="space-y-2">
            <div className="text-xs font-medium text-primary">
              {modificationTypeLabels[modificationType]} Content
            </div>
            <div className="bg-primary/5 rounded p-3 text-sm border-l-2 border-primary max-h-64 overflow-y-auto">
              <div className="whitespace-pre-wrap">{modifiedText}</div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="gap-2"
                  data-testid="regenerate-button"
                >
                  <RefreshCw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Generate a different version of the modification
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            disabled={isRegenerating}
            className="gap-2"
            data-testid="reject-button"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
          
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isRegenerating}
            className="gap-2"
            data-testid="accept-button"
          >
            <Check className="h-3 w-3" />
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Processing indicator */}
      {isRegenerating && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2 border-t">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <span>Regenerating content...</span>
        </div>
      )}
    </div>
  );
};
