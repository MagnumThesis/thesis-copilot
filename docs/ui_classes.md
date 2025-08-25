# UI Classes

## v1.0.0

This document provides a detailed breakdown of the major user interface (UI) components in the Thesis Copilot application. These components are primarily located in the `src/components/ui` directory.

**Note:** This documentation covers the core UI components. Additional UI components are documented in:
* [Remaining UI Components Documentation](ui_components_remaining.md) - UI components not covered in this document
* [Additional UI Components Documentation](ui_components_additional.md) - Further UI components not covered in the other documents
* [Final UI Components Documentation](ui_components_final.md) - The last set of UI components completing the documentation

### AIActionToolbar

**Location:** `src/components/ui/ai-action-toolbar.tsx`

**Description:** This component provides the main interface for selecting AI modes and displaying the status of AI operations. It includes buttons for Prompt, Continue, and Modify modes, as well as indicators for processing status and errors.

**Data Management:**

*   Manages the current AI mode (`currentMode`).
*   Displays the AI processing state (`isAIProcessing`).
*   Shows error information (`error`).

**Interaction with Logic Classes:**

*   Interacts with the `useAIModeManager` hook to change the AI mode and to get the current AI state.
*   Triggers AI operations in the `useAIModeManager` hook.

### AISearcher

**Location:** `src/components/ui/ai-searcher.tsx`

**Description:** This component is the main interface for the AI-powered reference search. It allows users to search for academic references, view the results, and add them to their library.

**Data Management:**

*   Manages the search query (`searchQuery`).
*   Stores the search results (`searchResults`).
*   Tracks the loading state (`loading`).
*   Stores error information (`searchError`).

**Interaction with Logic Classes:**

*   Uses the `useSearchResultTracking` hook to track search result interactions.
*   Uses the `usePrivacyManager` hook to manage user privacy settings.
*   Interacts with the `DuplicateDetectionEngine` to detect and resolve duplicate references.
*   Calls the `/api/ai-searcher/search` endpoint to perform a search.
*   Calls the `/api/referencer/add-from-search` endpoint to add a reference.

### Builder

**Location:** `src/components/ui/builder.tsx`

**Description:** This is the main component for the AI-powered thesis proposal editor. It integrates the `MilkdownEditor` with AI assistance capabilities, including prompt-based generation, content continuation, and text modification.

**Data Management:**

*   Manages the document content (`documentContent`).
*   Manages the current text selection (`currentSelection`).
*   Manages the cursor position (`cursorPosition`).
*   Stores AI-generated content (`aiGeneratedContent`).

**Interaction with Logic Classes:**

*   Uses the `useAIModeManager` hook to manage AI modes and process AI operations.
*   Uses the `contentRetrievalService` to load and store the builder content.
*   Interacts with the `MilkdownEditor` to get and set content, and to track selection and cursor position.

### MilkdownEditor

**Location:** `src/components/ui/milkdown-editor.tsx`

**Description:** This component is a wrapper around the Milkdown Markdown editor. It provides the main text editing interface for the user and is responsible for handling content changes, selection changes, and cursor position changes.

**Data Management:**

*   Manages the editor state, including the content, selection, and cursor position.

**Interaction with Logic Classes:**

*   Exposes methods for inserting and replacing content, which are used by the `Builder` component to handle AI-generated content.
*   Notifies the `Builder` component of any changes to the content, selection, or cursor position.

### Proofreader

**Location:** `src/components/ui/proofreader.tsx`

**Description:** This component is the main interface for the Proofreader tool. It allows users to analyze their thesis proposal for potential issues and provides structured feedback in the form of concerns.

**Data Management:**

*   Manages the list of proofreading concerns (`concerns`).
*   Tracks the analysis status (`isAnalyzing`, `analysisProgress`, `analysisStatusMessage`).
*   Stores error information (`error`).

**Interaction with Logic Classes:**

*   Uses the `contentRetrievalService` to retrieve the content for analysis.
*   Uses the `proofreaderErrorHandler` to handle errors that occur during analysis.
*   Uses the `proofreaderRecoveryService` to recover from errors and to manage the offline mode.
*   Uses the `proofreaderPerformanceOptimizer` to optimize the performance of the analysis.
*   Interacts with the `ConcernList` component to display the list of concerns.