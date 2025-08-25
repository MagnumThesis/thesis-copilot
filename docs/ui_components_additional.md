# Additional UI Components Documentation

## v1.0.0

This document provides documentation for additional UI components in the Thesis Copilot application that haven't been covered in the main UI classes documentation or the remaining UI components documentation. These components are primarily located in the `src/components/ui` directory.

## AI Modification Components

### AIModifyInterface

**Location:** `src/components/ui/ai-modify-interface.tsx`

**Description:** This component provides an interface for users to select a modification type for selected text and initiate AI-powered text modification. It displays various modification options with descriptions and examples, and handles the submission of the modification request.

**Data Management:**
*   Manages the selected modification type (`selectedModification`)
*   Tracks the text currently selected by the user (`selectedText`)
*   Manages processing state during AI operations (`isProcessing`)

**Interaction with Other Components:**
*   Uses `Button`, `Label`, `Separator` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onModify`, `onCancel`
*   Works with AI mode manager to process text modifications

### ModificationTypeSelector

**Location:** `src/components/ui/modification-type-selector.tsx`

**Description:** This component allows users to select the type of modification to apply to selected text. It provides various modification options like rewrite, expand, summarize, etc.

**Data Management:**
*   Manages the selected modification type (`selectedType`)
*   Tracks visibility state of the selector (`isOpen`)
*   Stores available modification types and their configurations

**Interaction with Other Components:**
*   Uses `Button`, `Card`, `Popover` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onSelect`, `onOpenChange`
*   Works with AI mode manager to provide context for text modification

### CustomPromptInput

**Location:** `src/components/ui/custom-prompt-input.tsx`

**Description:** This component provides an input interface for users to enter custom prompts for text modification. It includes features like auto-resizing, placeholder text, and prompt suggestions.

**Data Management:**
*   Manages the custom prompt input value (`value`)
*   Tracks input focus state (`isFocused`)
*   Stores placeholder text and examples (`placeholder`, `examples`)
*   Manages prompt suggestions visibility (`showSuggestions`)

**Interaction with Other Components:**
*   Uses `Textarea`, `Button`, `Label`, `Popover` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onChange`, `onSubmit`, `onFocus`, `onBlur`
*   Works with modification type selector to provide context for text modification

## Citation and Reference Components

### CitationPreview

**Location:** `src/components/ui/citation-preview.tsx`

**Description:** This component displays formatted inline citations and bibliography entries. It provides options to copy or insert the formatted text into the document.

**Data Management:**
*   Manages formatted inline citation text (`inlineCitation`)
*   Manages formatted bibliography entry text (`bibliographyEntry`)
*   Tracks processing state and errors (`isProcessing`, `error`)
*   Manages clipboard and insertion status (`copiedInline`, `copiedBibliography`, etc.)

**Interaction with Other Components:**
*   Uses `Button`, `Badge`, `Separator` components from the shadcn UI library
*   Accepts callbacks for user actions: `onCopyInline`, `onCopyBibliography`, `onInsertInline`, `onInsertBibliography`
*   Works with citation formatter to display formatted citations

### CitationInsertion

**Location:** `src/components/ui/citation-insertion.tsx`

**Description:** This component provides an interface for inserting citations into the document. It allows users to select from available references and insert properly formatted citations at the current cursor position.

**Data Management:**
*   Manages selected references for citation insertion
*   Tracks citation style and formatting preferences
*   Manages insertion state and success/failure status

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Accepts callbacks for user actions: `onInsert`, `onCancel`
*   Works with editor components to insert formatted citations

### BibliographyGenerator

**Location:** `src/components/ui/bibliography-generator.tsx`

**Description:** This component generates and displays a formatted bibliography based on selected references and citation style. It provides options for sorting, formatting, and exporting the bibliography.

**Data Management:**
*   Manages list of references for bibliography generation
*   Tracks selected citation style and formatting options
*   Manages sorting and organization preferences
*   Stores generated bibliography content

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Accepts callbacks for user actions: `onGenerate`, `onExport`, `onSort`
*   Works with reference management system to access reference data

### BibliographyPreview

**Location:** `src/components/ui/bibliography-preview.tsx`

**Description:** This component displays a preview of the generated bibliography with formatting options. It allows users to review and modify the bibliography before final insertion or export.

**Data Management:**
*   Manages bibliography content and formatting
*   Tracks preview settings and display options
*   Stores user modifications and annotations

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Accepts callbacks for user actions: `onUpdate`, `onSave`
*   Works with bibliography generator to display formatted output

## Chat and Messaging Components

### MessageInput

**Location:** `src/components/ui/message-input.tsx`

**Description:** This component provides a versatile input interface for sending messages, supporting text input, file attachments, and voice recording. It includes features like autosizing, drag-and-drop file uploads, and an interrupt prompt for AI generation.

**Data Management:**
*   Manages message input text (`value`)
*   Tracks file attachments (`files`)
*   Manages recording and transcription state (`isRecording`, `isTranscribing`)
*   Tracks drag-and-drop state (`isDragging`)

**Interaction with Other Components:**
*   Uses `Button`, `Textarea` components from the shadcn UI library
*   Integrates with `AudioVisualizer` and `FilePreview` components
*   Accepts callbacks for user actions: `onChange`, `onSubmit`, `stop`
*   Works with chat system to send messages and manage conversations

### MessageList

**Location:** `src/components/ui/message-list.tsx`

**Description:** This component displays a list of chat messages with appropriate styling and formatting. It handles different message types including user messages, AI responses, and system notifications.

**Data Management:**
*   Manages list of chat messages (`messages`)
*   Tracks typing indicators and loading states
*   Manages message grouping and display options

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Integrates with `ChatMessage` components for individual message display
*   Accepts callbacks for user actions: `onRateResponse`, `onRetry`
*   Works with chat system to display conversation history

### TypingIndicator

**Location:** `src/components/ui/typing-indicator.tsx`

**Description:** This component displays a typing indicator animation to show when the AI or another user is typing a response. It provides visual feedback during wait times.

**Data Management:**
*   Manages typing state and visibility (`isTyping`)
*   Tracks animation state and timing
*   Stores typing user information (for multi-user chats)

**Interaction with Other Components:**
*   Uses animation libraries for typing indicators
*   Integrates with chat systems to show typing status
*   Accepts callbacks for state changes: `onTypingStart`, `onTypingStop`
*   Works with chat and messaging systems to provide user feedback

## Audio and Media Components

### AudioVisualizer

**Location:** `src/components/ui/audio-visualizer.tsx`

**Description:** This component provides a visual representation of audio input during recording. It displays waveform data and provides visual feedback for audio recording operations.

**Data Management:**
*   Manages audio stream data (`stream`)
*   Tracks recording state (`isRecording`)
*   Stores visualization parameters and display options

**Interaction with Other Components:**
*   Uses canvas or SVG for audio visualization
*   Integrates with audio recording hooks
*   Accepts callbacks for user actions: `onClick`
*   Works with message input to provide recording feedback

## File and Content Components

### FilePreview

**Location:** `src/components/ui/file-preview.tsx`

**Description:** This component provides a preview interface for various file types including images, documents, and audio files. It supports different preview modes based on file type.

**Data Management:**
*   Manages file data and metadata (`file`)
*   Tracks preview mode and loading state (`previewMode`, `isLoading`)
*   Stores error state and preview content
*   Manages audio playback state for audio files

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Integrates with file type detection and preview systems
*   Accepts callbacks for user actions: `onClose`, `onDownload`
*   Works with file upload and management systems

### ContentSelector

**Location:** `src/components/ui/content-selector.tsx`

**Description:** This component allows users to select content from various sources for AI processing. It provides options to select text, files, or other content types.

**Data Management:**
*   Manages selected content and source information
*   Tracks content selection state and options
*   Stores content metadata and processing requirements

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Integrates with content retrieval systems
*   Accepts callbacks for user actions: `onSelect`, `onCancel`
*   Works with AI processing systems to provide content for analysis

## Dialog and Popup Components

### Dialog

**Location:** `src/components/ui/dialog.tsx`

**Description:** This component provides a modal dialog interface for displaying important information or requesting user input. It includes features for customization and accessibility.

**Data Management:**
*   Manages dialog visibility and state (`isOpen`)
*   Tracks dialog content and configuration
*   Stores user input and interaction data

**Interaction with Other Components:**
*   Uses dialog components from the shadcn UI library
*   Integrates with accessibility systems for proper ARIA attributes
*   Accepts callbacks for user actions: `onOpenChange`, `onSubmit`, `onCancel`
*   Works with various UI components that require modal interactions

## Search and Filter Components

### ContentSourceSelector

**Location:** `src/components/ui/content-source-selector.tsx`

**Description:** This component allows users to select content sources for AI processing. It provides options to choose from different data sources like ideas, builder content, or external sources.

**Data Management:**
*   Manages selected content sources and configurations
*   Tracks source availability and access permissions
*   Stores source metadata and processing options

**Interaction with Other Components:**
*   Uses various UI components from the shadcn UI library
*   Integrates with content retrieval systems
*   Accepts callbacks for user actions: `onSourceSelect`, `onConfigChange`
*   Works with AI processing systems to provide content for analysis

## Utility Components

### CopyButton

**Location:** `src/components/ui/copy-button.tsx`

**Description:** This component provides a button for copying content to the clipboard with visual feedback. It displays a success message when content is successfully copied.

**Data Management:**
*   Manages copy status and feedback (`copied`)
*   Tracks content to be copied (`content`)
*   Stores success message and display duration

**Interaction with Other Components:**
*   Uses `Button` component from the shadcn UI library
*   Integrates with clipboard API for copy operations
*   Accepts callbacks for user actions: `onCopy`
*   Works with any component that needs copy functionality

### AccessibleTooltip

**Location:** `src/components/ui/accessible-tooltip.tsx`

**Description:** This component provides accessible tooltips with proper ARIA attributes and keyboard navigation support. It ensures tooltips are usable by all users including those using screen readers.

**Data Management:**
*   Manages tooltip visibility state (`isOpen`)
*   Tracks trigger element and tooltip positioning
*   Stores tooltip content and accessibility properties

**Interaction with Other Components:**
*   Uses `Tooltip` components from the shadcn UI library
*   Integrates with ARIA attributes for accessibility
*   Accepts callbacks for user actions: `onOpenChange`
*   Works with any UI component that needs accessible tooltips

### VisuallyHidden

**Location:** `src/components/ui/visually-hidden.tsx`

**Description:** This component provides a way to hide content visually while keeping it accessible to screen readers. It's used for accessibility purposes to provide additional context to assistive technologies.

**Data Management:**
*   Manages hidden content and accessibility properties
*   Tracks visibility state for different user agents

**Interaction with Other Components:**
*   Uses accessibility attributes for screen readers
*   Works with any component that needs to provide hidden accessibility information

## Component Architecture Patterns

### State Management
Most UI components follow a consistent pattern for state management:
1. Local state for UI interactions (visibility, loading states, etc.)
2. Props for data display and configuration
3. Callback props for user interactions
4. Integration with global state management systems (where applicable)

### Accessibility
All components implement proper accessibility features:
1. ARIA attributes for screen readers
2. Keyboard navigation support
3. Proper focus management
4. Semantic HTML structure

### Performance
Components are optimized for performance:
1. Memoization for expensive calculations
2. Virtual scrolling for large lists
3. Lazy loading for heavy components
4. Efficient re-rendering strategies

### Error Handling
Components include robust error handling:
1. Graceful degradation for failed operations
2. User-friendly error messages
3. Recovery options and retry mechanisms
4. Logging for debugging purposes

This documentation covers additional UI components in the Thesis Copilot application, providing a comprehensive reference for developers working with these components.