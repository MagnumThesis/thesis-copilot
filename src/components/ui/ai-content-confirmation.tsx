"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { ScrollArea } from "@/components/ui/shadcn/scroll-area";
import { Separator } from "@/components/ui/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";
import { 
  Check, 
  X, 
  Copy, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Sparkles,
  Clock
} from "lucide-react";

interface AIContentConfirmationProps {
  content: string;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate?: () => void;
  isVisible: boolean;
  isRegenerating?: boolean;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
  };
  originalText?: string; // For modify mode preview
  modificationType?: string; // For modify mode context
  className?: string;
}

export const AIContentConfirmation: React.FC<AIContentConfirmationProps> = ({
  content,
  onAccept,
  onReject,
  onRegenerate,
  isVisible,
  isRegenerating = false,
  metadata,
  originalText,
  modificationType,
  className,
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  }, [content]);

  const togglePreview = useCallback(() => {
    setShowPreview(!showPreview);
  }, [showPreview]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "ai-content-confirmation bg-background border rounded-lg shadow-lg",
        "animate-in slide-in-from-bottom-4 duration-300",
        className
      )}
      role="dialog"
      aria-labelledby="ai-content-title"
      aria-describedby="ai-content-description"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 id="ai-content-title" className="font-medium">
            {originalText ? `AI Modified Content${modificationType ? ` (${modificationType})` : ''}` : 'AI Generated Content'}
          </h3>
          {metadata && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{metadata.processingTime}ms</span>
              {metadata.tokensUsed && (
                <span>• {metadata.tokensUsed} tokens</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePreview}
                className="h-8 w-8 p-0"
                aria-label={showPreview ? "Hide preview" : "Show preview"}
              >
                {showPreview ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showPreview ? "Hide preview" : "Show preview"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
                aria-label="Copy content"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {copied ? "Copied!" : "Copy content"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content Preview */}
      {showPreview && (
        <div className="p-4">
          <p
            id="ai-content-description"
            className="text-sm text-muted-foreground mb-3"
          >
            {originalText 
              ? "Review the modified content below. You can accept it to replace the selected text, reject it to discard, or regenerate for a different version."
              : "Review the generated content below. You can accept it to insert into your document, reject it to discard, or regenerate for a different version."
            }
          </p>
          
          {originalText ? (
            // Show before/after comparison for modify mode
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-red-500/20 border border-red-500/40 rounded"></div>
                  <span className="text-xs font-medium text-muted-foreground">Original Text</span>
                </div>
                <ScrollArea className="h-[120px] w-full border rounded-md bg-red-50/50 dark:bg-red-950/20">
                  <div className="p-3">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-red-800 dark:text-red-200">
                      {originalText}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500/20 border border-green-500/40 rounded"></div>
                  <span className="text-xs font-medium text-muted-foreground">Modified Text</span>
                </div>
                <ScrollArea className="h-[120px] w-full border rounded-md bg-green-50/50 dark:bg-green-950/20">
                  <div className="p-3">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-green-800 dark:text-green-200">
                      {content}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            // Show single content view for prompt/continue modes
            <ScrollArea className="h-[200px] w-full border rounded-md">
              <div className="p-3">
                <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                  {content}
                </pre>
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="gap-1"
                >
                  <RotateCcw className={cn(
                    "h-3 w-3",
                    isRegenerating && "animate-spin"
                  )} />
                  {isRegenerating ? "Regenerating..." : "Regenerate"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Generate a different version of the content
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isRegenerating}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
          
          <Button
            onClick={onAccept}
            disabled={isRegenerating}
            size="sm"
            className="gap-1"
          >
            <Check className="h-3 w-3" />
            Accept & Insert
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="px-4 pb-3 text-xs text-muted-foreground border-t pt-2">
        <strong>Shortcuts:</strong> Enter to accept, Escape to reject, R to regenerate
      </div>
    </div>
  );
};