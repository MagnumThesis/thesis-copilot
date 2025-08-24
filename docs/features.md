
# Features

## v1.0.0

This document provides a list of the main features implemented in the Thesis Copilot application, along with the modules and files that are primarily responsible for their implementation.

### AI-Powered Content Generation

**Description:** This feature allows users to generate content using AI. It includes three modes: Prompt, Continue, and Modify.

*   **Prompt Mode:** Generates content from a custom prompt.
*   **Continue Mode:** Continues writing from the current cursor position.
*   **Modify Mode:** Modifies selected text using various AI-powered modification options.

**Primary Modules/Files:**

*   `src/components/ui/builder.tsx`: The main UI component for the editor.
*   `src/components/ui/ai-action-toolbar.tsx`: The toolbar for selecting AI modes.
*   `src/hooks/use-ai-mode-manager.ts`: The hook for managing AI modes.
*   `src/worker/handlers/builder-ai.ts`: The backend handler for AI content generation.

### Proofreading

**Description:** This feature allows users to analyze their thesis proposal for potential issues. It provides structured feedback in the form of concerns, which are categorized by severity and type.

**Primary Modules/Files:**

*   `src/components/ui/proofreader.tsx`: The main UI component for the proofreader.
*   `src/worker/handlers/proofreader-ai.ts`: The backend handler for the proofreader.
*   `src/worker/lib/concern-analysis-engine.ts`: The engine for analyzing content and generating concerns.
*   `src/worker/lib/concern-status-manager.ts`: The manager for handling the status of concerns.

### Idea Management

**Description:** This feature allows users to create, manage, and organize their ideas. Each idea has a title and a description.

**Primary Modules/Files:**

*   `src/react-app/pages/Landing.tsx`: The main page for listing and creating ideas.
*   `src/react-app/pages/IdeaDetail.tsx`: The page for viewing and editing an idea.
*   `src/worker/handlers/ideas.ts`: The backend handler for ideas.
*   `migrations/v1_create_ideas_table.sql`: The database migration for the ideas table.

### Reference Management

**Description:** This feature allows users to search for and manage their references. It includes a reference searcher that can search for references from various sources, as well as a tool for formatting citations.

**Primary Modules/Files:**

*   `src/components/ui/referencer.tsx`: The main UI component for the reference manager.
*   `src/worker/handlers/referencer-api.ts`: The backend handler for the reference manager.
*   `src/worker/lib/reference-management-engine.ts`: The engine for managing references.
*   `migrations/v4_create_referencer_tables.sql`: The database migration for the referencer tables.
