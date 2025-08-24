"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";
import {
  Send,
  X,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";

interface CustomPromptInputProps {
  selectedText: string;
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
  onBack: () => void;
  isProcessing?: boolean;
  className?: string;
}

const promptSuggestions = [
  "Make this more formal and academic",
  "Simplify this for a general audience",
  "Add more technical details",
  "Make this more persuasive",
  "Convert to bullet points",
  "Add examples and illustrations",
  "Make this more concise",
  "Improve the logical flow",
];

/**
 * A component that allows users to input a custom prompt for AI text modification.
 * It provides a textarea for input, optional prompt suggestions, and handles submission and cancellation.
 * @param {CustomPromptInputProps} props - The properties for the CustomPromptInput component.
 * @param {string} props.selectedText - The text currently selected by the user that will be modified.
 * @param {(prompt: string) => void} props.onSubmit - Callback function to be called when the custom prompt is submitted.
 * @param {() => void} props.onCancel - Callback function to be called when the user cancels the custom prompt input.
 * @param {() => void} props.onBack - Callback function to navigate back to the previous step (e.g., modification type selection).
 * @param {boolean} [props.isProcessing=false] - Indicates whether an AI modification operation is currently in progress.
 * @param {string} [props.className] - Additional CSS classes to apply to the component container.
 * @example
 * ```tsx
 * <CustomPromptInput
 *   selectedText="This is the text to be modified."
 *   onSubmit={(prompt) => console.log('Custom prompt submitted:', prompt)}
 *   onCancel={() => console.log('Custom prompt cancelled')}
 *   onBack={() => console.log('Go back')}
 *   isProcessing={false}
 * />
 * ```
 */
export const CustomPromptInput: React.FC<CustomPromptInputProps> = ({
  selectedText,
  onSubmit,
  onCancel,
  onBack,
  isProcessing = false,
  className,
}) => {
  const [prompt, setPrompt] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isProcessing) return;
    
    onSubmit(trimmedPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const toggleSuggestions = () => {
    setShowSuggestions(!showSuggestions);
  };

  // Truncate selected text for display
  const displayText = selectedText.length > 100 
    ? selectedText.substring(0, 100) + "..." 
    : selectedText;

  const isSubmitDisabled = !prompt.trim() || isProcessing;

  return (
    <div
      className={cn(
        "bg-background border rounded-lg shadow-lg p-4 space-y-4 min-w-96 max-w-2xl",
        className
      )}
      role="dialog"
      aria-label="Custom prompt input"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isProcessing}
              className="h-6 w-6 p-0"
              aria-label="Back to modification types"
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <h3 className="text-sm font-medium text-foreground">
              Custom Modification Prompt
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
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

      {/* Prompt input */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="custom-prompt" className="text-sm font-medium text-foreground">
              How would you like to modify this text?
            </label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSuggestions}
                  disabled={isProcessing}
                  className="h-6 w-6 p-0"
                  aria-label="Show prompt suggestions"
                >
                  <Lightbulb className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showSuggestions ? "Hide suggestions" : "Show prompt suggestions"}
              </TooltipContent>
            </Tooltip>
          </div>
          
          <textarea
            ref={textareaRef}
            id="custom-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder="e.g., 'Make this more formal and academic' or 'Add more technical details and examples'"
            className={cn(
              "w-full min-h-[80px] max-h-[200px] p-3 text-sm",
              "border rounded-md resize-y",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "placeholder:text-muted-foreground"
            )}
            rows={3}
          />
          
          <div className="text-xs text-muted-foreground">
            Press Ctrl+Enter to submit, Escape to cancel
          </div>
        </div>

        {/* Prompt suggestions */}
        {showSuggestions && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Suggestion prompts:
            </div>
            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isProcessing}
                  className={cn(
                    "text-left text-xs p-2 rounded border",
                    "hover:bg-muted/50 hover:border-primary/20",
                    "focus:outline-none focus:ring-1 focus:ring-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors duration-200"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          Be specific about how you want the text modified
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isProcessing}
            className="gap-2"
          >
            <X className="h-3 w-3" />
            Cancel
          </Button>
          
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="gap-2"
            data-testid="submit-prompt-button"
          >
            <Send className="h-3 w-3" />
            {isProcessing ? "Processing..." : "Modify Text"}
          </Button>
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2 border-t">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <span>Processing custom modification...</span>
        </div>
      )}
    </div>
  );
};