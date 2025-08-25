# User Flow

## v1.0.0

This document outlines the primary user flow for a student using the Thesis Copilot to write a thesis proposal. The flow covers the initial brainstorming, idea definition, writing, proofreading, and reference management.

### 1. User Chats with AI to Brainstorm Ideas

*   **User Action:** The user starts by chatting with the AI to brainstorm ideas for their thesis.
*   **System Response:** The AI provides suggestions and helps the user to refine their ideas.
*   **Relevant Components:**
    *   `src/react-app/pages/Chatbot.tsx`: The main component for the chatbot.
    *   `src/worker/handlers/chat.ts`: The backend handler for the chatbot.

### 2. User Saves and Defines Ideas in the Idealist

*   **User Action:** The user saves the brainstormed ideas in the Idealist tool and defines them further.
*   **System Response:** The application saves the ideas to the database and displays them in the Idealist tool.
*   **Relevant Components:**
    *   `src/components/ui/idealist.tsx`: The main component for the Idealist tool.
    *   `src/worker/handlers/ideas.ts`: The backend handler for the Idealist tool.

### 3. User Writes in the Builder with AI Assistance

*   **User Action:** The user writes their thesis proposal in the Builder tool, using the AI features (Prompt, Continue, and Modify) to help them.
*   **System Response:** The application provides AI-powered assistance to the user, helping them to generate content, continue a section, or modify existing text.
*   **Relevant Components:**
    *   `src/components/ui/builder.tsx`: The main container for the Builder tool.
    *   `src/components/ui/milkdown-editor.tsx`: The text editor where the user writes.
    *   `src/components/ui/ai-action-toolbar.tsx`: The toolbar with the AI mode buttons.
    *   `src/hooks/use-ai-mode-manager.ts`: The hook that manages the AI mode state.
    *   `src/worker/handlers/builder-ai.ts`: The backend handler for the AI features.

### 4. User Uses the Proofreader to Check Their Work

*   **User Action:** The user opens the Proofreader tool from the Tools panel and clicks the "Analyze Content" button.
*   **System Response:** The system retrieves the content from the Builder, sends it to the backend for analysis, and then displays the identified concerns to the user.
*   **Relevant Components:**
    *   `src/components/ui/proofreader.tsx`: The main component for the Proofreader tool.
    *   `src/worker/handlers/proofreader-ai.ts`: The backend handler for the Proofreader tool.
    *   `src/components/ui/concern-list.tsx`: The component that displays the list of concerns.

### 5. User Uses the Referencer to Manage References

*   **User Action:** The user opens the Referencer tool to search for and manage their references.
*   **System Response:** The application allows the user to search for references from various sources, add them to their library, and format them in different citation styles.
*   **Relevant Components:**
    *   `src/components/ui/referencer.tsx`: The main component for the Referencer tool.
    *   `src/worker/handlers/referencer-api.ts`: The backend handler for the Referencer tool.
    *   `src/worker/lib/reference-management-engine.ts`: The engine for managing references.