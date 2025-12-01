"use client"

/**
 * @fileoverview Builder Component with AI Integration
 * 
 * The Builder component is the main interface for the AI-powered thesis proposal editor.
 * It integrates a Milkdown markdown editor with comprehensive AI assistance capabilities
 * including prompt-based generation, content continuation, and text modification.
 * 
 * Key Features:
 * - Multiple AI interaction modes (Prompt, Continue, Modify)
 * - Real-time content synchronization
 * - Comprehensive error handling and recovery
 * - Academic context awareness
 * - Accessibility compliance
 * 
 * @author Thesis Copilot Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { Button } from "@/components/ui/shadcn/button"
import { Skeleton } from "@/components/ui/shadcn/skeleton"
const MilkdownEditor = lazy(() => import("@/components/ui/milkdown-editor").then(m => ({ default: m.MilkdownEditor })))
const MilkdownProvider = lazy(() => import("@milkdown/react").then(m => ({ default: m.MilkdownProvider })))
const AIActionToolbar = lazy(() => import("@/components/ui/ai-action-toolbar").then(m => ({ default: m.AIActionToolbar })))
const AIPromptInput = lazy(() => import("@/components/ui/ai-prompt-input").then(m => ({ default: m.AIPromptInput })))
const AIContentConfirmation = lazy(() => import("@/components/ui/ai-content-confirmation").then(m => ({ default: m.AIContentConfirmation })))
const ModificationTypeSelector = lazy(() => import("@/components/ui/modification-type-selector").then(m => ({ default: m.ModificationTypeSelector })))
const AIContentPreview = lazy(() => import("@/components/ui/ai-content-preview").then(m => ({ default: m.AIContentPreview })))
const CustomPromptInput = lazy(() => import("@/components/ui/custom-prompt-input").then(m => ({ default: m.CustomPromptInput })))
import { useAIModeManager } from "@/hooks/use-ai-mode-manager"
import { AIMode, TextSelection, ContentInsertionOptions, ModificationType } from "@/lib/ai-types"
import { contentRetrievalService } from "@/lib/content-retrieval-service"
import { toast } from "sonner"

/**
 * Props for the Builder component
 */
interface BuilderProps {
  /** Whether the Builder sheet is open */
  isOpen: boolean;
  /** Callback function to close the Builder */
  onClose: () => void;
  /** Current conversation context for AI operations */
  currentConversation: { title: string; id: string };
}

/**
 * Builder Component - AI-Powered Thesis Proposal Editor
 * 
 * The Builder component provides a comprehensive interface for creating and editing
 * thesis proposals with AI assistance. It combines a rich markdown editor with
 * multiple AI interaction modes to help users overcome writer's block, continue
 * content generation, and modify existing text.
 * 
 * @component
 * @example
 * ```tsx
 * <Builder
 *   isOpen={true}
 *   onClose={() => setBuilderOpen(false)}
 *   currentConversation={{ title: "My Thesis", id: "conv-123" }}
 * />
 * ```
 * 
 * @param props - The component props
 * @returns The Builder component JSX
 */

interface EditorMethods {
  insertContent: (content: string, options: ContentInsertionOptions) => void;
  setContent?: (newContent: string) => void; // Make setContent optional to match the callback
  // Add other methods if you need to use them in the parent component
}


/**
 * The main interface for the AI-powered thesis proposal editor.
 * It integrates a Milkdown markdown editor with comprehensive AI assistance capabilities
 * including prompt-based generation, content continuation, and text modification.
 *
 * Key Features:
 * - Multiple AI interaction modes (Prompt, Continue, Modify)
 * - Real-time content synchronization
 * - Comprehensive error handling and recovery
 * - Academic context awareness
 * - Accessibility compliance
 *
 * @param {BuilderProps} props - The properties for the Builder component.
 * @param {boolean} props.isOpen - Whether the Builder sheet is open.
 * @param {() => void} props.onClose - Callback function to close the Builder.
 * @param {{title: string, id: string}} props.currentConversation - Current conversation context for AI operations.
 * @example
 * ```tsx
 * <Builder
 *   isOpen={true}
 *   onClose={() => setBuilderOpen(false)}
 *   currentConversation={{ title: "My Thesis", id: "conv-123" }}
 * />
 * ```
 */
export const Builder: React.FC<BuilderProps> = ({ isOpen, onClose, currentConversation }) => {
  const [documentContent, setDocumentContent] = useState("# Thesis Proposal\n\nStart writing your thesis proposal here...");
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [aiGeneratedContent, setAIGeneratedContent] = useState<string>("");
  const [showContentConfirmation, setShowContentConfirmation] = useState(false);
  const [pendingInsertionOptions, setPendingInsertionOptions] = useState<ContentInsertionOptions | null>(null);
  const [aiMetadata, setAIMetadata] = useState<{
    tokensUsed?: number;
    processingTime?: number;
    model?: string;
    academicValidation?: any;
  } | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  // Debounce refs for saving
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const SAVE_DEBOUNCE_MS = 800;
  const [originalTextForModification, setOriginalTextForModification] = useState<string>("");
  const [currentModificationType, setCurrentModificationType] = useState<ModificationType | null>(null);

  // Editor methods ref to interact with Milkdown editor
  const editorMethodsRef = useRef<EditorMethods | null>(null);

  // AI Mode Manager
  const aiModeManager = useAIModeManager(
    currentConversation.id,
    documentContent
  );

  // Update selection in AI mode manager when it changes
  React.useEffect(() => {
    aiModeManager.updateSelection(currentSelection);
  }, [currentSelection, aiModeManager]);


  // Load saved content when component mounts or conversation changes
  React.useEffect(() => {
    const loadSavedContent = async () => {
      try {
        const result = await contentRetrievalService.retrieveBuilderContent(currentConversation.id);
        if (result.success && result.builderContent && result.builderContent.content.trim()) {
          // Load the saved content instead of default
          const savedContent = result.builderContent.content;

          // Use the exposed setContent method to update the editor
          if (editorMethodsRef.current?.setContent) {
            editorMethodsRef.current.setContent(savedContent);
          } else {
            setDocumentContent(savedContent);
          }

        }
      } catch (error) {
        console.error('Failed to load saved Builder content:', error);
        // Keep default content if loading fails
      }
    };

    loadSavedContent();
  }, [currentConversation.id]);

  // Debounced save function - flushes pending content to the server
  const doSave = useCallback(async (forceContent?: string) => {
    const contentToSave = typeof forceContent === 'string' ? forceContent : pendingContentRef.current;
    if (contentToSave == null) return false;

    // mark saving
    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const saved = await contentRetrievalService.storeBuilderContent(currentConversation.id, contentToSave);
      // Invalidate cache to ensure other tools get fresh content
      contentRetrievalService.invalidateCache(currentConversation.id, 'builder');

      if (saved) {
        // fetch server timestamp for display
        try {
          const res = await fetch(`/api/builder-content/${encodeURIComponent(currentConversation.id)}`);
          if (res.ok) {
            const data = await res.json();
            const updatedAt = data.updated_at || data.updatedAt || null;
            if (updatedAt) setLastSavedAt(new Date(updatedAt).toLocaleString());
          }
        } catch (e) {
          // ignore timestamp fetch errors
        }

        setSaveStatus('saved');
        pendingContentRef.current = null;
        return true;
      } else {
        setSaveStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Failed to save Builder content:', error);
      setSaveStatus('error');
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [currentConversation.id]);

  // Handle content changes from editor (debounced)
  const handleContentChange = useCallback((content: string) => {
    setDocumentContent(content);

    // store pending content and schedule save
    pendingContentRef.current = content;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      // perform save
      void doSave();
      saveTimeoutRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, [doSave]);

  // Flush pending save when sheet is closed or component unmounts
  useEffect(() => {
    if (!isOpen) {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      if (pendingContentRef.current) {
        void doSave(pendingContentRef.current);
      }
    }
    // flush on unmount
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [isOpen, doSave]);

  // Handle selection changes from editor
  const handleSelectionChange = useCallback((selection: TextSelection | null) => {
    setCurrentSelection(selection);
  }, []);

  // Handle cursor position changes from editor
  const handleCursorPositionChange = useCallback((position: number) => {
    setCursorPosition(position);
  }, []);

  // Handle prompt submission with enhanced error handling
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
        // Error is already handled by the AI mode manager
        // Just show a generic message if needed
        if (!aiModeManager.errorState.hasError) {
          toast.error("Failed to generate content");
        }
      }
    } catch (error: unknown) {
      // Error is already handled by the AI mode manager
      console.error("Error processing prompt:", error);
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
      setAIMetadata(undefined);
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
    setAIMetadata(undefined);
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

  // Handle continue mode activation with enhanced error handling
  const handleContinueMode = useCallback(async () => {
    try {
      // Get fresh cursor position right before processing
      const currentCursorPos = (editorMethodsRef.current as any)?.getCurrentCursorPosition?.() ?? cursorPosition;
      console.log('[Builder] Continue mode - cursor position:', currentCursorPos);
      
      const response = await aiModeManager.processContinue(currentCursorPos, currentSelection?.text);

      if (response.success && response.content) {
        setAIGeneratedContent(response.content);
        setAIMetadata(response.metadata);

        // Set up insertion options for cursor position
        const insertionOptions: ContentInsertionOptions = {
          insertAt: currentCursorPos,
          preserveFormatting: true
        };
        console.log('[Builder] Setting insertion options:', insertionOptions);
        setPendingInsertionOptions(insertionOptions);
        setShowContentConfirmation(true);
      } else {
        // Error is already handled by the AI mode manager
        if (!aiModeManager.errorState.hasError) {
          toast.error("Failed to continue content");
        }
      }
    } catch (error: unknown) {
      // Error is already handled by the AI mode manager
      console.error("Error processing continue mode:", error);
    }
  }, [aiModeManager, cursorPosition, currentSelection, editorMethodsRef]);

  // Handle modification type selection with enhanced error handling
  const handleModificationTypeSelect = useCallback(async (modificationType: ModificationType) => {
    try {
      await aiModeManager.selectModificationType(modificationType);
      if (!aiModeManager.errorState.hasError) {
        toast.success("Modification generated successfully");
      }
    } catch (error: unknown) {
      // Error is already handled by the AI mode manager
      console.error("Error processing modification:", error);
    }
  }, [aiModeManager]);

  // Handle modification acceptance
  const handleAcceptModification = useCallback(() => {
    if (editorMethodsRef.current && aiModeManager.modificationPreviewContent && aiModeManager.selectedText) {
      console.log("Accepting modification:", {
        selectedText: aiModeManager.selectedText.text.substring(0, 50),
        start: aiModeManager.selectedText.start,
        end: aiModeManager.selectedText.end,
        previewContent: aiModeManager.modificationPreviewContent.substring(0, 50)
      });

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

  // Handle modification regeneration with enhanced error handling
  const handleRegenerateModification = useCallback(async () => {
    try {
      await aiModeManager.regenerateModification();
      if (!aiModeManager.errorState.hasError) {
        toast.success("Modification regenerated successfully");
      }
    } catch (error: unknown) {
      // Error is already handled by the AI mode manager
      console.error("Error regenerating modification:", error);
    }
  }, [aiModeManager]);

  // Handle custom prompt submission with enhanced error handling
  const handleCustomPromptSubmit = useCallback(async (prompt: string) => {
    try {
      await aiModeManager.submitCustomPrompt(prompt);
      if (!aiModeManager.errorState.hasError) {
        toast.success("Custom modification generated successfully");
      }
    } catch (error: unknown) {
      // Error is already handled by the AI mode manager
      console.error("Error processing custom prompt:", error);
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


  // Store editor methods when they become avail able

  const hasRun = useRef(false);

  const handleEditorMethodsReady = useCallback((methods: {
    insertContent: (content: string, options: ContentInsertionOptions) => void;
    setContent?: (newContent: string) => void;
  }) => {


    editorMethodsRef.current = methods;
    if (!isOpen) {
      hasRun.current = false;
      return
    };
    if (hasRun.current) return;
    if (editorMethodsRef?.current?.setContent) {
      // Use setTimeout to delay the content setting
      setTimeout(() => {
        editorMethodsRef.current?.setContent?.(documentContent);
      }, 500); // 2000 milliseconds = 2 seconds
      hasRun.current = true;
    }
  }, [documentContent, isOpen]);




  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px] md:max-w-4/5">
        <SheetHeader>
          <SheetTitle>Builder</SheetTitle>
          <SheetDescription>
            Build and manage your thesis components for "{currentConversation.title}"
          </SheetDescription>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${saveStatus === 'saving' ? 'bg-yellow-400' : saveStatus === 'saved' ? 'bg-green-500' : saveStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'}`} aria-hidden></span>
              <span>
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && (lastSavedAt ? `Saved to server • ${lastSavedAt}` : 'Saved to server')}
                {saveStatus === 'error' && 'Save failed'}
                {saveStatus === 'idle' && 'Saved locally'}
              </span>
            </span>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-150px)] gap-4">
          {/* AI Action Toolbar with Error Handling */}
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
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
              error={aiModeManager.errorState.error}
              canRetry={aiModeManager.errorState.canRetry}
              retryCount={aiModeManager.errorState.retryCount}
              onRetry={aiModeManager.retryLastOperation}
              onClearError={aiModeManager.clearError}
              onGracefulDegradation={aiModeManager.handleGracefulDegradation}
            />
          </Suspense>

          {/* Prompt Input (shown when in prompt mode) */}
          {aiModeManager.currentMode === AIMode.PROMPT && !showContentConfirmation && (
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <AIPromptInput
                onSubmit={handlePromptSubmit}
                onCancel={handlePromptCancel}
                isProcessing={aiModeManager.isProcessing}
              />
            </Suspense>
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
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <ModificationTypeSelector
                selectedText={aiModeManager.selectedText.text}
                onModificationTypeSelect={handleModificationTypeSelect}
                onCancel={handlePromptCancel}
                isProcessing={aiModeManager.isProcessing}
              />
            </Suspense>
          )}

          {/* Custom Prompt Input (shown when user selects prompt modification type) */}
          {aiModeManager.showCustomPromptInput && aiModeManager.selectedText && (
            <Suspense fallback={<Skeleton className="h-28 w-full" />}>
              <CustomPromptInput
                selectedText={aiModeManager.selectedText.text}
                onSubmit={handleCustomPromptSubmit}
                onCancel={handlePromptCancel}
                onBack={handleBackToModificationTypes}
                isProcessing={aiModeManager.isProcessing}
              />
            </Suspense>
          )}

          {/* Modification Preview (shown when previewing modifications) */}
          {aiModeManager.showModificationPreview &&
            aiModeManager.modificationPreviewContent &&
            aiModeManager.originalTextForModification &&
            aiModeManager.currentModificationType && (
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
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
            </Suspense>
            )}

          {/* AI Content Confirmation */}
          {showContentConfirmation && (
            <Suspense fallback={<Skeleton className="h-36 w-full" />}>
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
            </Suspense>
          )}

          {/* Editor */}
          <ScrollArea className="flex-1 pr-4">
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <MilkdownProvider>
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                  <MilkdownEditor
                    onContentChange={handleContentChange}
                    onSelectionChange={handleSelectionChange}
                    onCursorPositionChange={handleCursorPositionChange}
                    aiModeManager={aiModeManager}
                    onEditorMethodsReady={handleEditorMethodsReady} />
                </Suspense>
              </MilkdownProvider>
            </Suspense>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
