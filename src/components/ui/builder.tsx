"use client"

import React, { useState, useCallback, useRef } from "react"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { Button } from "@/components/ui/shadcn/button"
import { MilkdownEditor } from "@/components/ui/milkdown-editor"
import { MilkdownProvider } from "@milkdown/react"
import { AIActionToolbar } from "@/components/ui/ai-action-toolbar"
import { AIPromptInput } from "@/components/ui/ai-prompt-input"
import { AIContentConfirmation } from "@/components/ui/ai-content-confirmation"
import { ModificationTypeSelector } from "@/components/ui/modification-type-selector"
import { AIContentPreview } from "@/components/ui/ai-content-preview"
import { CustomPromptInput } from "@/components/ui/custom-prompt-input"
import { useAIModeManager } from "@/hooks/use-ai-mode-manager"
import { AIMode, TextSelection, ContentInsertionOptions, ModificationType } from "@/lib/ai-types"
import { toast } from "sonner"

interface BuilderProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversation: { title: string; id: string };
}

export const Builder: React.FC<BuilderProps> = ({ isOpen, onClose, currentConversation }) => {
  const [documentContent, setDocumentContent] = useState("# Thesis Proposal\n\nStart writing your thesis proposal here...");
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [aiGeneratedContent, setAIGeneratedContent] = useState<string>("");
  const [showContentConfirmation, setShowContentConfirmation] = useState(false);
  const [pendingInsertionOptions, setPendingInsertionOptions] = useState<ContentInsertionOptions | null>(null);
  const [aiMetadata, setAIMetadata] = useState<any>(null);
  const [originalTextForModification, setOriginalTextForModification] = useState<string>("");
  const [currentModificationType, setCurrentModificationType] = useState<ModificationType | null>(null);

  // Editor methods ref to interact with Milkdown editor
  const editorMethodsRef = useRef<any>(null);

  // AI Mode Manager
  const aiModeManager = useAIModeManager(
    currentConversation.id,
    documentContent
  );

  // Update selection in AI mode manager when it changes
  React.useEffect(() => {
    aiModeManager.updateSelection(currentSelection);
  }, [currentSelection, aiModeManager]);

  // Handle content changes from editor
  const handleContentChange = useCallback((content: string) => {
    setDocumentContent(content);
  }, []);

  // Handle selection changes from editor
  const handleSelectionChange = useCallback((selection: TextSelection | null) => {
    setCurrentSelection(selection);
  }, []);

  // Handle cursor position changes from editor
  const handleCursorPositionChange = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);

  // Handle prompt submission
  const handlePromptSubmit = useCallback(async (prompt: string) => {
    try {
      const response = await aiModeManager.processPrompt(prompt, cursorPosition);
      
      if (response.success && response.content) {
        setAIGeneratedContent(response.content);
        setAIMetadata(response.metadata);
        
        // Set up insertion options for cursor position
        const insertionOptions: ContentInsertionOptions = {
          insertAt: cursorPosition,
          preserveFormatting: true
        };
        setPendingInsertionOptions(insertionOptions);
        setShowContentConfirmation(true);
      } else {
        const errorMessage = !response.success ? (response as any).error : "Failed to generate content";
        toast.error(errorMessage || "Failed to generate content");
      }
    } catch (error: any) {
      console.error("Error processing prompt:", error);
      toast.error(error.message || "Failed to generate content");
    }
  }, [aiModeManager, cursorPosition]);

  // Handle AI content acceptance
  const handleAcceptAIContent = useCallback(() => {
    if (editorMethodsRef.current && aiGeneratedContent && pendingInsertionOptions) {
      editorMethodsRef.current.insertContent(aiGeneratedContent, pendingInsertionOptions);
      
      // Reset state
      setShowContentConfirmation(false);
      setAIGeneratedContent("");
      setPendingInsertionOptions(null);
      setAIMetadata(null);
      setOriginalTextForModification("");
      setCurrentModificationType(null);
      aiModeManager.resetMode();
      
      toast.success("Content inserted successfully");
    }
  }, [aiGeneratedContent, pendingInsertionOptions, aiModeManager]);

  // Handle AI content rejection
  const handleRejectAIContent = useCallback(() => {
    setShowContentConfirmation(false);
    setAIGeneratedContent("");
    setPendingInsertionOptions(null);
    setAIMetadata(null);
    setOriginalTextForModification("");
    setCurrentModificationType(null);
    aiModeManager.resetMode();
  }, [aiModeManager]);

  // Handle AI content regeneration
  const handleRegenerateContent = useCallback(async () => {
    if (aiModeManager.currentMode === AIMode.PROMPT) {
      // For regeneration, we need to store the last prompt
      // This is a simplified version - in a full implementation,
      // you'd want to store the last prompt used
      toast.info("Please submit a new prompt to regenerate content");
      handleRejectAIContent();
    }
  }, [aiModeManager.currentMode, handleRejectAIContent]);

  // Handle continue mode activation
  const handleContinueMode = useCallback(async () => {
    try {
      const response = await aiModeManager.processContinue(cursorPosition, currentSelection?.text);
      
      if (response.success && response.content) {
        setAIGeneratedContent(response.content);
        setAIMetadata(response.metadata);
        
        // Set up insertion options for cursor position
        const insertionOptions: ContentInsertionOptions = {
          insertAt: cursorPosition,
          preserveFormatting: true
        };
        setPendingInsertionOptions(insertionOptions);
        setShowContentConfirmation(true);
      } else {
        const errorMessage = !response.success ? (response as any).error : "Failed to continue content";
        toast.error(errorMessage || "Failed to continue content");
      }
    } catch (error: any) {
      console.error("Error processing continue mode:", error);
      toast.error(error.message || "Failed to continue content");
    }
  }, [aiModeManager, cursorPosition, currentSelection]);

  // Handle modification type selection
  const handleModificationTypeSelect = useCallback(async (modificationType: ModificationType) => {
    try {
      await aiModeManager.selectModificationType(modificationType);
      toast.success("Modification generated successfully");
    } catch (error: any) {
      console.error("Error processing modification:", error);
      toast.error(error.message || "Failed to generate modification");
    }
  }, [aiModeManager]);

  // Handle modification acceptance
  const handleAcceptModification = useCallback(() => {
    if (editorMethodsRef.current && aiModeManager.modificationPreviewContent && aiModeManager.selectedText) {
      const insertionOptions: ContentInsertionOptions = {
        insertAt: aiModeManager.selectedText.start,
        replaceRange: {
          start: aiModeManager.selectedText.start,
          end: aiModeManager.selectedText.end
        },
        preserveFormatting: true
      };
      
      editorMethodsRef.current.insertContent(aiModeManager.modificationPreviewContent, insertionOptions);
      aiModeManager.acceptModification();
      toast.success("Modification applied successfully");
    }
  }, [aiModeManager]);

  // Handle modification rejection
  const handleRejectModification = useCallback(() => {
    aiModeManager.rejectModification();
  }, [aiModeManager]);

  // Handle modification regeneration
  const handleRegenerateModification = useCallback(async () => {
    try {
      await aiModeManager.regenerateModification();
      toast.success("Modification regenerated successfully");
    } catch (error: any) {
      console.error("Error regenerating modification:", error);
      toast.error(error.message || "Failed to regenerate modification");
    }
  }, [aiModeManager]);

  // Handle custom prompt submission
  const handleCustomPromptSubmit = useCallback(async (prompt: string) => {
    try {
      await aiModeManager.submitCustomPrompt(prompt);
      toast.success("Custom modification generated successfully");
    } catch (error: any) {
      console.error("Error processing custom prompt:", error);
      toast.error(error.message || "Failed to generate custom modification");
    }
  }, [aiModeManager]);

  // Handle back to modification types
  const handleBackToModificationTypes = useCallback(() => {
    aiModeManager.backToModificationTypes();
  }, [aiModeManager]);

  // Handle modify mode start
  const handleStartModifyMode = useCallback(() => {
    if (!aiModeManager.validateTextSelection(currentSelection)) {
      toast.error("Please select text to modify");
      return;
    }
    aiModeManager.startModifyMode();
  }, [aiModeManager, currentSelection]);

  // Handle prompt cancellation
  const handlePromptCancel = useCallback(() => {
    aiModeManager.resetMode();
  }, [aiModeManager]);

  // Store editor methods when they become available
  const handleEditorMethodsReady = useCallback((methods: any) => {
    editorMethodsRef.current = methods;
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px] md:max-w-4/5">
        <SheetHeader>
          <SheetTitle>Builder</SheetTitle>
          <SheetDescription>
            Build and manage your thesis components for "{currentConversation.title}"
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100vh-150px)] gap-4">
          {/* AI Action Toolbar */}
          <AIActionToolbar
            currentMode={aiModeManager.currentMode}
            onModeChange={(mode) => {
              if (mode === AIMode.MODIFY) {
                handleStartModifyMode();
              } else {
                aiModeManager.setMode(mode);
              }
            }}
            hasSelectedText={aiModeManager.hasSelectedText}
            isAIProcessing={aiModeManager.isProcessing}
          />

          {/* Prompt Input (shown when in prompt mode) */}
          {aiModeManager.currentMode === AIMode.PROMPT && !showContentConfirmation && (
            <AIPromptInput
              onSubmit={handlePromptSubmit}
              onCancel={handlePromptCancel}
              isProcessing={aiModeManager.isProcessing}
            />
          )}

          {/* Continue Mode Activation (shown when in continue mode) */}
          {aiModeManager.currentMode === AIMode.CONTINUE && !showContentConfirmation && !aiModeManager.isProcessing && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="flex-1">
                <h4 className="font-medium">Continue Content Generation</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  AI will continue writing from your current cursor position, maintaining the style and tone of your existing content.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePromptCancel}>
                  Cancel
                </Button>
                <Button onClick={handleContinueMode}>
                  Continue Writing
                </Button>
              </div>
            </div>
          )}

          {/* Modification Type Selector (shown when selecting modification type) */}
          {aiModeManager.showModificationTypeSelector && aiModeManager.selectedText && (
            <ModificationTypeSelector
              selectedText={aiModeManager.selectedText.text}
              onModificationTypeSelect={handleModificationTypeSelect}
              onCancel={handlePromptCancel}
              isProcessing={aiModeManager.isProcessing}
            />
          )}

          {/* Custom Prompt Input (shown when user selects prompt modification type) */}
          {aiModeManager.showCustomPromptInput && aiModeManager.selectedText && (
            <CustomPromptInput
              selectedText={aiModeManager.selectedText.text}
              onSubmit={handleCustomPromptSubmit}
              onCancel={handlePromptCancel}
              onBack={handleBackToModificationTypes}
              isProcessing={aiModeManager.isProcessing}
            />
          )}

          {/* Modification Preview (shown when previewing modifications) */}
          {aiModeManager.showModificationPreview && 
           aiModeManager.modificationPreviewContent && 
           aiModeManager.originalTextForModification &&
           aiModeManager.currentModificationType && (
            <AIContentPreview
              originalText={aiModeManager.originalTextForModification}
              modifiedText={aiModeManager.modificationPreviewContent}
              modificationType={aiModeManager.currentModificationType}
              onAccept={handleAcceptModification}
              onReject={handleRejectModification}
              onRegenerate={handleRegenerateModification}
              isVisible={aiModeManager.showModificationPreview}
              isRegenerating={aiModeManager.isProcessing}
            />
          )}

          {/* AI Content Confirmation */}
          {showContentConfirmation && (
            <AIContentConfirmation
              content={aiGeneratedContent}
              onAccept={handleAcceptAIContent}
              onReject={handleRejectAIContent}
              onRegenerate={handleRegenerateContent}
              isVisible={showContentConfirmation}
              metadata={aiMetadata}
              originalText={originalTextForModification || undefined}
              modificationType={currentModificationType || undefined}
            />
          )}

          {/* Editor */}
          <ScrollArea className="flex-1 pr-4">
            <MilkdownProvider>
              <MilkdownEditor
                initialContent={documentContent}
                onContentChange={handleContentChange}
                onSelectionChange={handleSelectionChange}
                onCursorPositionChange={handleCursorPositionChange}
                aiModeManager={aiModeManager}
                onEditorMethodsReady={handleEditorMethodsReady}
              />
            </MilkdownProvider>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}