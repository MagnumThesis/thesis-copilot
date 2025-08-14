"use client";

import React from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { ModificationType } from "@/lib/ai-types";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Expand,
  Minimize2,
  Lightbulb,
  MessageSquare,
  Check,
  X,
} from "lucide-react";

interface ModificationTypeConfig {
  type: ModificationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

const modificationConfigs: ModificationTypeConfig[] = [
  {
    type: ModificationType.REWRITE,
    label: "Rewrite",
    description: "Rewrite the text to improve clarity, flow, and academic quality while preserving meaning",
    icon: RefreshCw,
    shortcut: "R",
  },
  {
    type: ModificationType.EXPAND,
    label: "Expand",
    description: "Add more detail, examples, and supporting information to the selected text",
    icon: Expand,
    shortcut: "E",
  },
  {
    type: ModificationType.SUMMARIZE,
    label: "Summarize",
    description: "Condense the text to capture essential points in a more concise form",
    icon: Minimize2,
    shortcut: "S",
  },
  {
    type: ModificationType.IMPROVE_CLARITY,
    label: "Improve Clarity",
    description: "Enhance readability by simplifying complex sentences and improving word choice",
    icon: Lightbulb,
    shortcut: "C",
  },
  {
    type: ModificationType.PROMPT,
    label: "Custom Prompt",
    description: "Provide a custom instruction for how you want the text to be modified",
    icon: MessageSquare,
    shortcut: "P",
  },
];

interface ModificationTypeSelectorProps {
  selectedText: string;
  onModificationTypeSelect: (type: ModificationType) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  className?: string;
}

export const ModificationTypeSelector: React.FC<ModificationTypeSelectorProps> = ({
  selectedText,
  onModificationTypeSelect,
  onCancel,
  isProcessing = false,
  className,
}) => {
  const handleTypeSelect = (type: ModificationType) => {
    if (isProcessing) return;
    onModificationTypeSelect(type);
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onCancel();
  };

  // Truncate selected text for display
  const displayText = selectedText.length > 100 
    ? selectedText.substring(0, 100) + "..." 
    : selectedText;

  return (
    <div
      className={cn(
        "bg-background border rounded-lg shadow-lg p-4 space-y-4 min-w-80 max-w-md",
        className
      )}
      role="dialog"
      aria-label="Select modification type"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            Modify Selected Text
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isProcessing}
            className="h-6 w-6 p-0"
            aria-label="Cancel modification"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Selected text preview */}
        <div className="bg-muted rounded p-2 text-xs text-muted-foreground border-l-2 border-primary">
          <div className="font-medium mb-1">Selected text:</div>
          <div className="italic">"{displayText}"</div>
        </div>
      </div>

      {/* Modification type buttons */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Choose modification type:
        </div>
        <div className="grid grid-cols-2 gap-2">
          {modificationConfigs.map((config) => {
            const Icon = config.icon;
            
            return (
              <Tooltip key={config.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTypeSelect(config.type)}
                    disabled={isProcessing}
                    className={cn(
                      "h-auto p-3 flex flex-col items-center gap-2 text-center transition-all duration-200",
                      "hover:bg-primary/5 hover:border-primary/20",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                    data-testid={`modification-type-${config.type}`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="space-y-1">
                      <div className="text-xs font-medium">{config.label}</div>
                      {config.shortcut && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {config.shortcut}
                        </div>
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {config.description}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <span>Processing modification...</span>
        </div>
      )}
    </div>
  );
};