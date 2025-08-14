"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Label } from "@/components/ui/shadcn/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { cn } from "@/lib/utils";
import { Send, Loader2, X, Lightbulb } from "lucide-react";

interface AIPromptInputProps {
  onSubmit: (prompt: string) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}

const PROMPT_SUGGESTIONS = [
  "Write an introduction for my thesis proposal",
  "Explain the methodology for my research",
  "Create a literature review section",
  "Describe the expected outcomes",
  "Write a conclusion paragraph",
];

export const AIPromptInput: React.FC<AIPromptInputProps> = ({
  onSubmit,
  onCancel,
  isProcessing,
  className,
  placeholder = "Enter your prompt to generate content...",
  maxLength = 500,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate prompt input
  useEffect(() => {
    const trimmedPrompt = prompt.trim();
    setIsValid(trimmedPrompt.length > 0 && trimmedPrompt.length <= maxLength);
  }, [prompt, maxLength]);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isProcessing) return;

    try {
      await onSubmit(prompt.trim());
      setPrompt(""); // Clear prompt after successful submission
    } catch (error) {
      console.error("Error submitting prompt:", error);
      // Error handling is managed by the parent component
    }
  }, [prompt, isValid, isProcessing, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const remainingChars = maxLength - prompt.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <div
      className={cn(
        "ai-prompt-input bg-background border rounded-lg p-4 shadow-sm space-y-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="ai-prompt" className="text-sm font-medium">
            AI Prompt
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="h-6 w-6 p-0"
                aria-label="Show prompt suggestions"
              >
                <Lightbulb className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show prompt suggestions</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
          aria-label="Cancel prompt"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Suggestions (click to use):
          </Label>
          <div className="grid gap-1">
            {PROMPT_SUGGESTIONS.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="justify-start text-left h-auto p-2 text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          disabled={isProcessing}
          className={cn(
            "resize-none",
            !isValid && prompt.length > 0 && "border-destructive"
          )}
          aria-describedby="prompt-help"
        />
        
        {/* Character count and validation */}
        <div className="flex items-center justify-between text-xs">
          <div id="prompt-help" className="text-muted-foreground">
            {prompt.length === 0 
              ? "Describe what content you'd like to generate"
              : !isValid && prompt.trim().length === 0
              ? "Prompt cannot be empty"
              : !isValid && prompt.length > maxLength
              ? "Prompt is too long"
              : "Press Ctrl+Enter to submit"
            }
          </div>
          <div
            className={cn(
              "text-muted-foreground",
              isNearLimit && "text-warning",
              remainingChars < 0 && "text-destructive"
            )}
          >
            {remainingChars} characters remaining
          </div>
        </div>
      </div>

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
          disabled={!isValid || isProcessing}
          size="sm"
          className="min-w-[80px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-3 w-3 mr-1" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        <strong>Shortcuts:</strong> Ctrl+Enter to submit, Escape to cancel
      </div>
    </div>
  );
};