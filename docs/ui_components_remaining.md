# Remaining UI Components Documentation

## v1.0.0

This document provides documentation for the remaining UI components in the Thesis Copilot application that haven't been covered in the main UI classes documentation. These components are primarily located in the `src/components/ui` directory.

## AI Content Components

### AIContentConfirmation

**Location:** `src/components/ui/ai-content-confirmation.tsx`

**Description:** This component displays AI-generated content for review and allows the user to accept, reject, or regenerate it. It provides a preview of the content, metadata about the AI operation, and actions for user interaction.

**Data Management:**
*   Manages the visibility state of the component (`isVisible`)
*   Tracks whether content is being regenerated (`isRegenerating`)
*   Stores AI generation metadata (`metadata`)
*   Manages preview visibility state (`showPreview`)
*   Tracks clipboard copy status (`copied`)

**Interaction with Other Components:**
*   Uses `Button` and `ScrollArea` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onAccept`, `onReject`, `onRegenerate`
*   Works with both prompt/continue modes and modify mode (with original text comparison)

### AIContentPreview

**Location:** `src/components/ui/ai-content-preview.tsx`

**Description:** This component provides a preview of AI-generated content with options for user interaction. It displays the content in a scrollable area and provides actions for accepting, rejecting, or regenerating the content.

**Data Management:**
*   Manages the visibility state of the component (`isVisible`)
*   Tracks whether content is being regenerated (`isRegenerating`)
*   Stores AI generation metadata (`metadata`)
*   Manages preview visibility state (`showPreview`)
*   Tracks clipboard copy status (`copied`)

**Interaction with Other Components:**
*   Uses `Button`, `ScrollArea`, `Separator` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onAccept`, `onReject`, `onRegenerate`
*   Works with both prompt/continue modes and modify mode (with original text comparison)

### AIErrorNotification

**Location:** `src/components/ui/ai-error-notification.tsx`

**Description:** This component displays error notifications related to AI operations. It provides detailed error information, recovery options, and actions for users to address issues.

**Data Management:**
*   Stores error information (`error`)
*   Tracks retry attempts and status (`retryCount`, `maxRetries`)
*   Manages error type classification (`errorType`)
*   Tracks whether the error has been acknowledged (`isAcknowledged`)

**Interaction with Other Components:**
*   Uses `Alert`, `Button`, `Badge` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onRetry`, `onDismiss`, `onProvideFeedback`
*   Works with AI mode manager to provide context-specific error handling

## AI Input Components

### AIPromptInput

**Location:** `src/components/ui/ai-prompt-input.tsx`

**Description:** This component provides an input interface for users to enter custom prompts for AI generation. It includes features like auto-resizing, placeholder text, and keyboard shortcuts.

**Data Management:**
*   Manages the prompt input value (`value`)
*   Tracks input focus state (`isFocused`)
*   Stores placeholder text and examples (`placeholder`, `examples`)
*   Manages keyboard shortcut hints (`showShortcuts`)

**Interaction with Other Components:**
*   Uses `Textarea`, `Button`, `Label` components from the shadcn UI library
*   Integrates with `Tooltip` components for additional information
*   Accepts callbacks for user actions: `onChange`, `onSubmit`, `onFocus`, `onBlur`
*   Works with AI mode manager to provide context for prompt generation

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

## Reference Management Components

### BibliographyControls

**Location:** `src/components/ui/bibliography-controls.tsx`

**Description:** This component provides controls for managing bibliography generation, including style selection, sorting options, and export functionality.

**Data Management:**
*   Manages selected citation style (`selectedStyle`)
*   Tracks sorting order (`sortOrder`)
*   Stores export format preferences (`exportFormat`)
*   Manages loading state during bibliography generation (`isLoading`)

**Interaction with Other Components:**
*   Uses `Select`, `Button`, `Label`, `Card` components from the shadcn UI library
*   Integrates with citation style engine for formatting
*   Accepts callbacks for user actions: `onStyleChange`, `onSortChange`, `onGenerate`, `onExport`
*   Works with reference management system to access reference data

### CitationFormatter

**Location:** `src/components/ui/citation-formatter.tsx`

**Description:** This component allows users to format citations and generate bibliographies based on selected references and citation styles. It provides real-time formatting, validation, and options to copy or generate a full bibliography.

**Data Management:**
*   Manages selected citation style (`selectedStyle`)
*   Tracks selected references (`selectedReferences`)
*   Stores formatting results (`formattingResults`)
*   Manages bibliography generation state (`bibliography`, `sortOrder`)
*   Tracks loading state and clipboard status (`loading`, `copiedToClipboard`)

**Interaction with Other Components:**
*   Uses `Select`, `Button`, `Label`, `Card`, `Badge`, `Alert` components from the shadcn UI library
*   Integrates with citation style engine for formatting
*   Accepts callbacks for user actions: `onFormattedCitations`
*   Works with reference management system to access reference data

### ReferenceForm

**Location:** `src/components/ui/reference-form.tsx`

**Description:** This component provides a form interface for adding or editing references. It includes fields for all relevant reference metadata and validation.

**Data Management:**
*   Manages form field values (`formData`)
*   Tracks form validation state (`errors`, `isValid`)
*   Stores reference being edited (`referenceId`)
*   Manages loading state during save operations (`isSaving`)

**Interaction with Other Components:**
*   Uses `Input`, `Select`, `Textarea`, `Button`, `Label`, `Card`, `Alert` components from the shadcn UI library
*   Integrates with reference validation system
*   Accepts callbacks for user actions: `onSave`, `onCancel`, `onDelete`
*   Works with reference management system to create/update references

### ReferenceList

**Location:** `src/components/ui/reference-list.tsx`

**Description:** This component displays a list of references with search and filtering capabilities. It provides options to view, edit, or delete references.

**Data Management:**
*   Manages list of references (`references`)
*   Tracks search query and filters (`searchQuery`, `filterType`)
*   Stores pagination state (`page`, `pageSize`, `total`)
*   Manages loading state during data retrieval (`isLoading`)

**Interaction with Other Components:**
*   Uses `Input`, `Select`, `Button`, `Card`, `Badge`, `ScrollArea` components from the shadcn UI library
*   Integrates with search and filtering systems
*   Accepts callbacks for user actions: `onEdit`, `onDelete`, `onPageChange`
*   Works with reference management system to retrieve and manipulate references

## Proofreader Components

### AnalysisProgress

**Location:** `src/components/ui/analysis-progress.tsx`

**Description:** This component displays the progress and status of an analysis operation, including error handling and recovery options. It provides visual feedback on the analysis state (analyzing, complete, error) and suggests actions to the user.

**Data Management:**
*   Manages analysis state (`isAnalyzing`, `progress`, `statusMessage`)
*   Tracks error state and recovery options (`error`, `success`, `recoveryOptions`)
*   Stores connection status (`isOnline`)
*   Manages fallback and cache usage indicators (`fallbackUsed`, `cacheUsed`)

**Interaction with Other Components:**
*   Uses `Button`, `Progress`, `Badge`, `Alert` components from the shadcn UI library
*   Integrates with tooltip system for additional information
*   Accepts callbacks for user actions: `onCancel`, `onRetry`, `onDismissError`
*   Works with proofreader engine to display analysis progress

### ConcernDetail

**Location:** `src/components/ui/concern-detail.tsx`

**Description:** This component displays detailed information about a specific proofreading concern, including its category, severity, description, and suggested actions.

**Data Management:**
*   Manages the concern being displayed (`concern`)
*   Tracks the status of the concern (`status`)
*   Stores user notes and actions related to the concern (`notes`, `actions`)
*   Manages loading state during status updates (`isUpdating`)

**Interaction with Other Components:**
*   Uses `Button`, `Badge`, `Card`, `Textarea`, `Select` components from the shadcn UI library
*   Integrates with status management system
*   Accepts callbacks for user actions: `onStatusChange`, `onNotesChange`, `onClose`
*   Works with concern analysis engine to provide detailed concern information

### ConcernList

**Location:** `src/components/ui/concern-list.tsx`

**Description:** This component displays a list of proofreading concerns with filtering and sorting capabilities. It allows users to view, categorize, and manage concerns.

**Data Management:**
*   Manages list of concerns (`concerns`)
*   Tracks filter and sort criteria (`filter`, `sort`)
*   Stores pagination state (`page`, `pageSize`, `total`)
*   Manages bulk selection state (`selectedConcerns`)

**Interaction with Other Components:**
*   Uses `Button`, `Select`, `Input`, `Card`, `Badge`, `Checkbox` components from the shadcn UI library
*   Integrates with filtering and sorting systems
*   Accepts callbacks for user actions: `onFilterChange`, `onSortChange`, `onStatusUpdate`
*   Works with concern status manager to retrieve and update concerns

## Chat Components

### Chat

**Location:** `src/components/ui/chat.tsx`

**Description:** This component provides a comprehensive chat interface that displays messages, handles user input, and provides various chat-related functionalities. It integrates with message lists, input fields, and optional prompt suggestions.

**Data Management:**
*   Manages list of chat messages (`messages`)
*   Tracks input state (`input`, `isGenerating`)
*   Stores chat configuration and options
*   Manages file attachments and audio input (`files`, `transcribeAudio`)

**Interaction with Other Components:**
*   Uses `Button`, `Textarea`, `ScrollArea` components from the shadcn UI library
*   Integrates with message input and message list components
*   Accepts callbacks for user actions: `handleSubmit`, `handleInputChange`, `stop`
*   Works with AI backend to process chat messages

### ChatMessage

**Location:** `src/components/ui/chat-message.tsx`

**Description:** This component displays individual chat messages with appropriate styling based on the message role (user or assistant). It handles various message types including text, tool calls, and file attachments.

**Data Management:**
*   Manages message content and metadata (`message`)
*   Tracks message role and display properties
*   Stores tool invocation data and results
*   Manages message actions and options

**Interaction with Other Components:**
*   Uses `Button`, `Badge`, `Avatar`, `Card` components from the shadcn UI library
*   Integrates with markdown renderer for rich text display
*   Accepts callbacks for user actions: `onRateResponse`, `onRetry`
*   Works with chat component to display conversation history

## Search Components

### AISearcher

**Location:** `src/components/ui/ai-searcher.tsx`

**Description:** This component provides an AI-powered academic reference search interface. It allows users to search for references, view results, and add them to their library.

**Data Management:**
*   Manages search query and parameters (`searchQuery`, `filters`)
*   Tracks search results and loading state (`results`, `loading`)
*   Stores search history and analytics
*   Manages duplicate detection and resolution state

**Interaction with Other Components:**
*   Uses `Input`, `Button`, `Select`, `Card`, `Badge`, `ScrollArea` components from the shadcn UI library
*   Integrates with privacy manager for user privacy settings
*   Accepts callbacks for user actions: `onSearch`, `onAddReference`, `onFilterChange`
*   Works with search backend to retrieve academic references

### SearchResults

**Location:** `src/components/ui/search-results.tsx`

**Description:** This component displays search results from the AI-powered reference search. It provides detailed information about each result and options for accepting or rejecting suggestions.

**Data Management:**
*   Manages list of search results (`suggestions`)
*   Tracks user selections and actions (`acceptedSuggestions`, `rejectedSuggestions`)
*   Stores search analytics and performance data
*   Manages result filtering and sorting state

**Interaction with Other Components:**
*   Uses `Card`, `Button`, `Badge`, `ScrollArea`, `Separator` components from the shadcn UI library
*   Integrates with citation formatter for reference formatting
*   Accepts callbacks for user actions: `onSuggestionSelect`, `onNewSearch`
*   Works with search backend to display and manage search results

## Utility Components

### AccessibleTooltip

**Location:** `src/components/ui/accessible-tooltip.tsx`

**Description:** This component provides accessible tooltips with proper ARIA attributes and keyboard navigation support. It ensures tooltips are usable by all users including those using screen readers.

**Data Management:**
*   Manages tooltip visibility state (`isOpen`)
*   Tracks trigger element and tooltip positioning
*   Stores tooltip content and accessibility properties
*   Manages keyboard focus and navigation state

**Interaction with Other Components:**
*   Uses `Tooltip` components from the shadcn UI library
*   Integrates with ARIA attributes for accessibility
*   Accepts callbacks for user actions: `onOpenChange`
*   Works with any UI component that needs accessible tooltips

### ConsentBanner

**Location:** `src/components/ui/consent-banner.tsx`

**Description:** This component displays a consent banner for privacy and data collection policies. It provides information about data usage and options for users to accept or customize their preferences.

**Data Management:**
*   Manages consent status and preferences (`consentStatus`)
*   Tracks banner visibility state (`isVisible`)
*   Stores consent categories and user selections
*   Manages loading state during consent saving

**Interaction with Other Components:**
*   Uses `Button`, `Card`, `Checkbox`, `Dialog` components from the shadcn UI library
*   Integrates with privacy manager for consent handling
*   Accepts callbacks for user actions: `onAccept`, `onCustomize`, `onDecline`
*   Works with privacy controls to manage user preferences

### CopyButton

**Location:** `src/components/ui/copy-button.tsx`

**Description:** This component provides a button for copying content to the clipboard with visual feedback. It displays a success message when content is successfully copied.

**Data Management:**
*   Manages copy status and feedback (`copied`)
*   Tracks content to be copied (`content`)
*   Stores success message and display duration
*   Manages button state during copy operations

**Interaction with Other Components:**
*   Uses `Button` component from the shadcn UI library
*   Integrates with clipboard API for copy operations
*   Accepts callbacks for user actions: `onCopy`
*   Works with any component that needs copy functionality

### FilePreview

**Location:** `src/components/ui/file-preview.tsx`

**Description:** This component provides a preview interface for various file types including images, documents, and audio files. It supports different preview modes based on file type.

**Data Management:**
*   Manages file data and metadata (`file`)
*   Tracks preview mode and loading state (`previewMode`, `isLoading`)
*   Stores error state and preview content
*   Manages audio playback state for audio files

**Interaction with Other Components:**
*   Uses `Button`, `Card`, `ScrollArea`, `Audio` components from the shadcn UI library
*   Integrates with file type detection and preview systems
*   Accepts callbacks for user actions: `onClose`, `onDownload`
*   Works with file upload and management systems

### MarkdownRenderer

**Location:** `src/components/ui/markdown-renderer.tsx`

**Description:** This component renders Markdown content with proper styling and formatting. It supports various Markdown elements including headings, lists, code blocks, and links.

**Data Management:**
*   Manages Markdown content (`content`)
*   Tracks rendering state and options (`options`)
*   Stores parsed content and rendering errors
*   Manages code block and syntax highlighting state

**Interaction with Other Components:**
*   Uses `ScrollArea` component from the shadcn UI library
*   Integrates with Markdown parsing and rendering libraries
*   Accepts callbacks for user actions: `onContentChange`
*   Works with any component that needs to display formatted text content

### PrivacyControls

**Location:** `src/components/ui/privacy-controls.tsx`

**Description:** This component provides controls for managing privacy settings and data collection preferences. It allows users to customize their privacy preferences and view data usage information.

**Data Management:**
*   Manages privacy settings and preferences (`settings`)
*   Tracks user consent status and selections
*   Stores privacy policy information and data usage details
*   Manages loading state during settings updates

**Interaction with Other Components:**
*   Uses `Button`, `Card`, `Checkbox`, `Select`, `Switch` components from the shadcn UI library
*   Integrates with privacy manager for settings management
*   Accepts callbacks for user actions: `onSave`, `onReset`, `onChange`
*   Works with consent banner and privacy systems to manage user preferences

### TypingIndicator

**Location:** `src/components/ui/typing-indicator.tsx`

**Description:** This component displays a typing indicator animation to show when the AI or another user is typing a response. It provides visual feedback during wait times.

**Data Management:**
*   Manages typing state and visibility (`isTyping`)
*   Tracks animation state and timing
*   Stores typing user information (for multi-user chats)
*   Manages animation intervals and cleanup

**Interaction with Other Components:**
*   Uses animation libraries for typing indicators
*   Integrates with chat systems to show typing status
*   Accepts callbacks for state changes: `onTypingStart`, `onTypingStop`
*   Works with chat and messaging systems to provide user feedback

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

This documentation covers the remaining UI components in the Thesis Copilot application, providing a comprehensive reference for developers working with these components.