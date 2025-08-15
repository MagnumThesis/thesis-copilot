"use client";

import React from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { Separator } from "@/components/ui/shadcn/separator";
import { AIMode, AIError } from "@/lib/ai-infrastructure";
import { cn } from "@/lib/utils";
import {
  MessageSquarePlus,
  ArrowRight,
  PenLine,
  Loader2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AIErrorNotification } from "./ai-error-notification";

interface AIActionToolbarProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  hasSelectedText: boolean;
  isAIProcessing: boolean;
  error?: AIError | null;
  canRetry?: boolean;
  retryCount?: number;
  onRetry?: () => void;
  onClearError?: () => void;
  onGracefulDegradation?: () => void;
  className?: string;
}

interface ModeConfig {
  mode: AIMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  requiresSelection?: boolean;
}

const modeConfigs: ModeConfig[] = [
  {
    mode: AIMode.PROMPT,
    label: "Prompt",
    description:
      "Generate content from a custom prompt to help overcome writer's block and create initial drafts",
    icon: MessageSquarePlus,
    shortcut: "Ctrl+P",
  },
  {
    mode: AIMode.CONTINUE,
    label: "Continue",
    description:
      "Continue generating content from your current cursor position while maintaining style and flow",
    icon: ArrowRight,
    shortcut: "Ctrl+Enter",
  },
  {
    mode: AIMode.MODIFY,
    label: "Modify",
    description:
      "Modify selected text with AI assistance (rewrite, expand, summarize, or improve clarity)",
    icon: PenLine,
    shortcut: "Ctrl+M",
    requiresSelection: true,
  },
];

export const AIActionToolbar: React.FC<AIActionToolbarProps> = ({
  currentMode,
  onModeChange,
  hasSelectedText,
  isAIProcessing,
  error,
  canRetry = false,
  retryCount = 0,
  onRetry,
  onClearError,
  onGracefulDegradation,
  className,
}) => {
  const handleModeClick = (mode: AIMode) => {
    if (isAIProcessing) return;

    // Clear any existing errors when switching modes
    if (error && onClearError) {
      onClearError();
    }

    // Toggle mode - if clicking the same mode, deactivate it
    if (currentMode === mode) {
      onModeChange(AIMode.NONE);
    } else {
      onModeChange(mode);
    }
  };

  const isModeDisabled = (config: ModeConfig): boolean => {
    if (isAIProcessing) return true;
    if (config.requiresSelection && !hasSelectedText) return true;
    return false;
  };

  const isModeActive = (mode: AIMode): boolean => {
    return currentMode === mode;
  };

  const hasError = error !== null && error !== undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Main Toolbar */}
      <div
        className={cn(
          "flex items-center gap-1 p-2 bg-background border rounded-lg shadow-sm",
          hasError && "border-destructive/50"
        )}
        role="toolbar"
        aria-label="AI assistance modes"
      >
        {/* AI Indicator with Status */}
        <div className="flex items-center gap-2 px-2">
          {hasError ? (
            <AlertTriangle className="size-4 text-destructive" />
          ) : navigator.onLine ? (
            <Sparkles className="size-4 text-primary" />
          ) : (
            <WifiOff className="size-4 text-muted-foreground" />
          )}
          <span className={cn(
            "text-sm font-medium",
            hasError ? "text-destructive" : "text-muted-foreground"
          )}>
            AI {hasError ? "Error" : !navigator.onLine ? "Offline" : ""}
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Mode Buttons */}
        <div className="flex items-center gap-1">
          {modeConfigs.map((config) => {
            const Icon = config.icon;
            const isActive = isModeActive(config.mode);
            const isDisabled = isModeDisabled(config) || hasError;

            return (
              <Tooltip key={config.mode}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleModeClick(config.mode)}
                    disabled={isDisabled}
                    className={cn(
                      "relative transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground shadow-sm",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      hasError && "border-destructive/20"
                    )}
                    aria-pressed={isActive}
                    aria-label={`${config.label} mode${
                      isActive ? " (active)" : ""
                    }${isDisabled ? " (disabled)" : ""}`}
                    data-testid={`ai-mode-${config.mode}`}
                  >
                    {isAIProcessing && isActive ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4" />
                    )}
                    <span className="ml-1.5">{config.label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-foreground rounded-full" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                    {config.shortcut && (
                      <div className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                        {config.shortcut}
                      </div>
                    )}
                    {config.requiresSelection && !hasSelectedText && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        Requires text selection
                      </div>
                    )}
                    {hasError && (
                      <div className="text-xs text-destructive">
                        Clear error to use AI modes
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Status Indicators */}
        {(isAIProcessing || hasError || canRetry) && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 px-2">
              {isAIProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
              
              {hasError && canRetry && onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 px-2 text-xs"
                  disabled={isAIProcessing}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Error Notification */}
      {hasError && error && onClearError && (
        <AIErrorNotification
          error={error}
          onRetry={onRetry}
          onDismiss={onClearError}
          onGracefulDegradation={onGracefulDegradation}
          canRetry={canRetry}
          retryCount={retryCount}
        />
      )}
    </div>
  );
};
