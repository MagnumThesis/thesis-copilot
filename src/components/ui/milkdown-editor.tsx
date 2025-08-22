import { useEffect, useState, useCallback, useRef, type FC } from "react";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/react";
import { Editor } from "@milkdown/kit/core";
import { replaceAll } from "@milkdown/kit/utils";

import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import "./milkdown-editor.css";

import {
  TextSelection,
  ContentInsertionOptions,
  AIMode,
} from "../../lib/ai-types";

// Import the actual AI Mode Manager interface
import type { UseAIModeManager } from "../../hooks/use-ai-mode-manager";

// Enhanced Milkdown Editor Props
export interface MilkdownEditorProps {
  content: string; // Make content required and controlled
  onContentChange?: (content: string) => void;
  onSelectionChange?: (selection: TextSelection | null) => void;
  onCursorPositionChange?: (position: number) => void;
  aiModeManager?: UseAIModeManager;
  onEditorMethodsReady?: (methods: any) => void;
  className?: string;
}

// AI Content Preview Component
interface AIContentPreviewProps {
  content: string;
  onAccept: () => void;
  onReject: () => void;
  isVisible: boolean;
}

const AIContentPreview: FC<AIContentPreviewProps> = ({
  content,
  onAccept,
  onReject,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div className="ai-content-preview">
      <div className="ai-content-preview-header">
        <span>AI Generated Content Preview</span>
      </div>
      <div className="ai-content-preview-body">
        <pre>{content}</pre>
      </div>
      <div className="ai-content-preview-actions">
        <button onClick={onAccept} className="accept-btn">
          Accept
        </button>
        <button onClick={onReject} className="reject-btn">
          Reject
        </button>
      </div>
    </div>
  );
};

export const MilkdownEditor: FC<MilkdownEditorProps> = ({
  content,
  onContentChange,
  onSelectionChange,
  onCursorPositionChange,
  aiModeManager,
  onEditorMethodsReady,
  className = "",
}) => {
  const [currentSelection, setCurrentSelection] =
    useState<TextSelection | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [aiPreviewContent, setAIPreviewContent] = useState<string>("");
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [pendingInsertionOptions, setPendingInsertionOptions] =
    useState<ContentInsertionOptions | null>(null);

  const editorRef = useRef<Editor | null>(null);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);

  const { get } = useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: content,
    });

    // Store editor reference for direct manipulation
    editorRef.current = crepe.editor;

    return crepe;
  }, []);

  // Handle content changes from editor
  const handleContentChange = useCallback(
    (newContent: string) => {
      // Only notify parent if content actually changed
      if (newContent !== content) {
        onContentChange?.(newContent);
      }
    },
    [onContentChange, content]
  );

  // Track text selection changes
  const handleSelectionChange = useCallback(() => {
    // Clear existing timeout
    if (selectionTimeoutRef.current) {
      clearTimeout(selectionTimeoutRef.current);
    }

    // Debounce selection tracking to avoid excessive calls
    selectionTimeoutRef.current = setTimeout(() => {
      const editor = get();
      if (!editor) return;

      try {
        // Get current selection from editor
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          setCurrentSelection(null);
          onSelectionChange?.(null);
          return;
        }

        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        if (selectedText.length > 0) {
          const textSelection: TextSelection = {
            start: range.startOffset,
            end: range.endOffset,
            text: selectedText,
          };

          setCurrentSelection(textSelection);
          onSelectionChange?.(textSelection);
        } else {
          setCurrentSelection(null);
          onSelectionChange?.(null);
        }

        // Update cursor position
        const newCursorPosition = range.startOffset || 0;
        setCursorPosition(newCursorPosition);
        onCursorPositionChange?.(newCursorPosition);
      } catch (error) {
        console.warn("Error tracking selection:", error);
      }
    }, 100);
  }, [get, onSelectionChange, onCursorPositionChange]);

  // Set up selection tracking
  useEffect(() => {
    const editor = get();
    if (!editor) return;

    // Add event listeners for selection changes
    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("keyup", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("keyup", handleSelectionChange);

      if (selectionTimeoutRef.current) {
        clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, [get, handleSelectionChange]);

  // Update editor content when content prop changes
  useEffect(() => {
    const editor = get();
    if (editor && content !== lastContentRef.current) {
      lastContentRef.current = content;
      editor.action(replaceAll(content));
    }
  }, [content, get]);

  // Content insertion method for AI-generated content
  const insertContent = useCallback(
    (newContent: string, options: ContentInsertionOptions) => {
      const editor = get();
      if (!editor) return;

      try {
        if (options.replaceRange) {
          // Replace selected text
          const { start, end } = options.replaceRange;
          const currentContent = content;
          const beforeSelection = currentContent.substring(0, start);
          const afterSelection = currentContent.substring(end);
          const updatedContent = beforeSelection + newContent + afterSelection;

          editor.action(replaceAll(updatedContent));
          handleContentChange(updatedContent);
        } else {
          // Insert at cursor position
          const currentContent = content;
          const beforeCursor = currentContent.substring(0, options.insertAt);
          const afterCursor = currentContent.substring(options.insertAt);
          const updatedContent = beforeCursor + newContent + afterCursor;

          editor.action(replaceAll(updatedContent));
          handleContentChange(updatedContent);
        }
      } catch (error) {
        console.error("Error inserting content:", error);
      }
    },
    [get, content, handleContentChange]
  );

  // Replace selected text method
  const replaceSelectedText = useCallback(
    (newText: string) => {
      if (!currentSelection) return;

      const options: ContentInsertionOptions = {
        insertAt: currentSelection.start,
        replaceRange: {
          start: currentSelection.start,
          end: currentSelection.end,
        },
        preserveFormatting: true,
      };

      insertContent(newText, options);
    },
    [currentSelection, insertContent]
  );

  // Get current document content
  const getCurrentContent = useCallback(() => {
    return content;
  }, [content]);

  // Get current cursor position
  const getCurrentCursorPosition = useCallback(() => {
    return cursorPosition;
  }, [cursorPosition]);

  // Get current selection
  const getCurrentSelection = useCallback(() => {
    return currentSelection;
  }, [currentSelection]);

  // AI content preview handlers
  const showAIContentPreview = useCallback(
    (previewContent: string, insertionOptions: ContentInsertionOptions) => {
      setAIPreviewContent(previewContent);
      setPendingInsertionOptions(insertionOptions);
      setShowAIPreview(true);
    },
    []
  );

  const handleAcceptAIContent = useCallback(() => {
    if (pendingInsertionOptions && aiPreviewContent) {
      insertContent(aiPreviewContent, pendingInsertionOptions);
    }
    setShowAIPreview(false);
    setAIPreviewContent("");
    setPendingInsertionOptions(null);
  }, [aiPreviewContent, pendingInsertionOptions, insertContent]);

  const handleRejectAIContent = useCallback(() => {
    setShowAIPreview(false);
    setAIPreviewContent("");
    setPendingInsertionOptions(null);
  }, []);

  // Expose methods for AI integration
  const editorMethods = {
    insertContent,
    replaceSelectedText,
    getCurrentContent,
    getCurrentCursorPosition,
    getCurrentSelection,
    showAIContentPreview,
  };

  // Attach methods to AI mode manager if provided
  useEffect(() => {
    if (aiModeManager && typeof aiModeManager === "object") {
      // Extend aiModeManager with editor methods
      Object.assign(aiModeManager, { editorMethods });
    }
    
    // Notify parent component that editor methods are ready
    if (onEditorMethodsReady) {
      onEditorMethodsReady(editorMethods);
    }
  }, [aiModeManager, editorMethods, onEditorMethodsReady]);

  return (
    <div className={`milkdown-editor-container ${className}`}>
      <Milkdown />
      <AIContentPreview
        content={aiPreviewContent}
        onAccept={handleAcceptAIContent}
        onReject={handleRejectAIContent}
        isVisible={showAIPreview}
      />
    </div>
  );
};
