"use client";

import React from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { Separator } from "@/components/ui/shadcn/separator";
import { AIMode } from "@/lib/ai-types";
import { cn } from "@/lib/utils";
import {
  MessageSquarePlus,
  ArrowRight,
  PenLine,
  Loader2,
  Sparkles,
} from "lucide-react";

interface AIActionToolbarProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  hasSelectedText: boolean;
  isAIProcessing: boolean;
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
  className,
}) => {
  const handleModeClick = (mode: AIMode) => {
    if (isAIProcessing) return;

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

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-2 bg-background border rounded-lg shadow-sm",
        className
      )}
      role="toolbar"
      aria-label="AI assistance modes"
    >
      {/* AI Indicator */}
      <div className="flex items-center gap-2 px-2">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">AI</span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Mode Buttons */}
      <div className="flex items-center gap-1">
        {modeConfigs.map((config) => {
          const Icon = config.icon;
          const isActive = isModeActive(config.mode);
          const isDisabled = isModeDisabled(config);

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
                    isDisabled && "opacity-50 cursor-not-allowed"
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
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Processing Indicator */}
      {isAIProcessing && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 px-2 text-sm text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Processing...</span>
          </div>
        </>
      )}
    </div>
  );
};
