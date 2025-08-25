"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
// Using custom radio group implementation with buttons
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { Separator } from "@/components/ui/shadcn/separator";
import { cn } from "@/lib/utils";
import { 
  PenLine, 
  Expand, 
  Minimize2, 
  Lightbulb, 
  X, 
  Loader2,
  FileText
} from "lucide-react";
import { ModificationType } from "@/lib/ai-types";

interface AIModifyInterfaceProps {
  selectedText: string;
  onModify: (modificationType: ModificationType) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
  className?: string;
}

interface ModificationOption {
  type: ModificationType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  example: string;
}

const modificationOptions: ModificationOption[] = [
  {
    type: ModificationType.REWRITE,
    label: "Rewrite",
    description: "Improve clarity, flow, and academic quality while preserving meaning",
    icon: PenLine,
    example: "Rewrite for better academic style and clearer expression"
  },
  {
    type: ModificationType.EXPAND,
    label: "Expand",
    description: "Add more detail, examples, and supporting information",
    icon: Expand,
    example: "Add explanations, examples, and elaborate on key points"
  },
  {
    type: ModificationType.SUMMARIZE,
    label: "Summarize",
    description: "Condense to essential points in a more concise form",
    icon: Minimize2,
    example: "Extract key points and present them concisely"
  },
  {
    type: ModificationType.IMPROVE_CLARITY,
    label: "Improve Clarity",
    description: "Simplify complex sentences and enhance logical flow",
    icon: Lightbulb,
    example: "Simplify language and improve readability"
  }
];

/**
 * Provides an interface for users to select a modification type for selected text and initiate AI-powered text modification.
 * It displays various modification options with descriptions and examples, and handles the submission of the modification request.
 * @param {AIModifyInterfaceProps} props - The properties for the AIModifyInterface component.
 * @param {string} props.selectedText - The text currently selected by the user that will be modified.
 * @param {(modificationType: ModificationType) => Promise<void>} props.onModify - Callback function to be called when a modification type is selected and confirmed. It receives the chosen `ModificationType`.
 * @param {() => void} props.onCancel - Callback function to be called when the user cancels the modification process.
 * @param {boolean} props.isProcessing - Indicates whether an AI modification operation is currently in progress.
 * @param {string} [props.className] - Additional CSS classes to apply to the component container.
 * @example
 * ```tsx
 * import { ModificationType } from "@/lib/ai-types";
 *
 * <AIModifyInterface
 *   selectedText="This is some text to modify."
 *   onModify={async (type) => console.log('Modifying:', type)}
 *   onCancel={() => console.log('Cancelled')}
 *   isProcessing={false}
 * />
 * ```
 */
export const AIModifyInterface: React.FC<AIModifyInterfaceProps> = ({
  selectedText,
  onModify,
  onCancel,
  isProcessing,
  className,
}) => {
  const [selectedModification, setSelectedModification] = useState<ModificationType | null>(null);

  const handleModificationChange = useCallback((value: ModificationType) => {
    setSelectedModification(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedModification || isProcessing) return;

    try {
      await onModify(selectedModification);
    } catch (error) {
      console.error("Error processing modification:", error);
      // Error handling is managed by the parent component
    }
  }, [selectedModification, isProcessing, onModify]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && selectedModification) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [selectedModification, handleSubmit, onCancel]
  );

  const selectedOption = modificationOptions.find(opt => opt.type === selectedModification);

  return (
    <div
      className={cn(
        "ai-modify-interface bg-background border rounded-lg p-4 shadow-sm space-y-4",
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">
            Modify Selected Text
          </Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
          aria-label="Cancel modification"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Selected Text Preview */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Selected Text ({selectedText.length} characters):
        </Label>
        <div className="p-3 bg-muted/50 rounded-md border max-h-24 overflow-y-auto">
          <p className="text-sm font-mono leading-relaxed">
            {selectedText.length > 200 
              ? `${selectedText.substring(0, 200)}...` 
              : selectedText
            }
          </p>
        </div>
      </div>

      <Separator />

      {/* Modification Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Choose Modification Type:
        </Label>
        
        <div className="space-y-2">
          {modificationOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedModification === option.type;
            
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => handleModificationChange(option.type)}
                disabled={isProcessing}
                className={cn(
                  "w-full flex items-start space-x-3 p-3 rounded-lg border transition-colors text-left",
                  isSelected 
                    ? "bg-primary/5 border-primary ring-2 ring-primary/20" 
                    : "bg-background hover:bg-muted/50 border-border",
                  isProcessing && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 mt-1 flex items-center justify-center",
                  isSelected 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground"
                )}>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className={cn(
                      "h-4 w-4",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "font-medium",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Example: {option.example}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview of Selected Option */}
      {selectedOption && (
        <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <selectedOption.icon className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">
              {selectedOption.label} Mode
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedOption.description}
          </p>
        </div>
      )}

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedModification || isProcessing}
          size="sm"
          className="min-w-[100px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Modifying...
            </>
          ) : (
            <>
              <PenLine className="h-3 w-3 mr-1" />
              Modify Text
            </>
          )}
        </Button>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        <strong>Shortcuts:</strong> Enter to modify, Escape to cancel
      </div>
    </div>
  );
};