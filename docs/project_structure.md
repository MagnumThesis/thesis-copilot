
# Project Structure

## v1.0.0

```
C:\Users\njtan\Documents\GitHub\thesis-copilot\
├───.aiexclude - Contains patterns for files to be excluded from AI processing.
├───.gitignore - Specifies intentionally untracked files to ignore.
├───ABOUT.md - Provides information about the project.
├───BUILDER.md - Documentation for the Builder tool.
├───components.json - Configuration for UI components.
├───eslint.config.js - Configuration for ESLint.
├───eslint.config.mjs - ES module configuration for ESLint.
├───example.env - Example environment file.
├───implementation_plan.md - Plan for implementing the project.
├───index.html - The main HTML file.
├───package-lock.json - Records the exact version of each installed package.
├───package.json - Manages project dependencies and scripts.
├───README.md - A general guide to the project.
├───tsconfig.app.json - TypeScript configuration for the application.
├───tsconfig.json - TypeScript configuration for the project.
├───tsconfig.node.json - TypeScript configuration for Node.js.
├───tsconfig.worker.json - TypeScript configuration for the worker.
├───vite.config.ts - Configuration for Vite.
├───vitest.config.ts - Configuration for Vitest.
├───worker-configuration.d.ts - TypeScript declarations for the worker configuration.
├───wrangler.json - Configuration for Wrangler.
├───.git\ - Contains git repository files.
├───.kiro\ - Contains Kiro-related files.
│   └───specs\ - Contains specifications for different tools.
│       ├───ai-builder-integration\ - Specifications for AI builder integration.
│       ├───ai-reference-searcher\ - Specifications for AI reference searcher.
│       ├───proofreader-tool\ - Specifications for the proofreader tool.
│       └───referencer-tool\ - Specifications for the referencer tool.
├───.vscode\ - Contains VS Code settings.
├───.wrangler\ - Contains Wrangler files.
│   ├───deploy\ - Contains deployment configuration.
│   │   └───config.json - Deployment configuration file.
│   ├───state\ - Contains state information.
│   │   └───v3\ - Version 3 of the state information.
│   └───tmp\ - Contains temporary files.
│       └───dev-T8jvp3\ - Temporary development files.
├───dist\ - Contains the distributable files.
├───docs\ - Contains project documentation.
│   ├───ai-features-user-guide.md - User guide for AI features.
│   ├───ai-integration-developer-guide.md - Developer guide for AI integration.
│   ├───modify-mode-prompt-feature.md - Documentation for the modify mode prompt feature.
│   ├───proofreader-developer-guide.md - Developer guide for the proofreader tool.
│   ├───proofreader-migration-deployment-guide.md - Migration and deployment guide for the proofreader tool.
│   └───proofreader-user-guide.md - User guide for the proofreader tool.
├───migrations\ - Contains database migration files.
│   ├───new_db.sql - SQL script for creating a new database.
│   ├───README.md - README for the migrations.
│   ├───test_migration.sql - SQL script for a test migration.
│   ├───test_v4_migration.sql - SQL script for a test v4 migration.
│   ├───v1_create_ideas_table.sql - SQL script for creating the ideas table.
│   ├───v2_alter_ideas_table.sql - SQL script for altering the ideas table.
│   ├───v3_create_proofreading_tables.sql - SQL script for creating the proofreading tables.
│   ├───v3_rollback_proofreading_tables.sql - SQL script for rolling back the proofreading tables.
│   ├───v4_create_referencer_tables.sql - SQL script for creating the referencer tables.
│   ├───v4_rollback_referencer_tables.sql - SQL script for rolling back the referencer tables.
│   ├───v5_create_builder_content_table.sql - SQL script for creating the builder content table.
│   ├───v6_create_search_analytics_tables.sql - SQL script for creating the search analytics tables.
│   ├───v7_create_learning_system_tables.sql - SQL script for creating the learning system tables.
│   ├───v8_create_privacy_settings_table.sql - SQL script for creating the privacy settings table.
│   ├───validate_syntax.sql - SQL script for validating syntax.
│   └───VERIFICATION_CHECKLIST.md - Checklist for verifying migrations.
├───node_modules\ - Contains Node.js modules.
├───public\ - Contains public assets.
│   └───vite.svg - Vite logo.
├───scripts\ - Contains scripts.
│   └───verify-proofreader-integration.js - Script for verifying the proofreader integration.
└───src\ - Contains the source code.
    ├───types.ts - Contains TypeScript types.
    ├───components\ - Contains React components.
    │   ├───app-sidebar.tsx - The application sidebar component.
    │   ├───resizable-layout.tsx - A resizable layout component.
    │   ├───search-form.tsx - A search form component.
    │   └───ui\ - Contains UI components.
    ├───hooks\ - Contains React hooks.
    │   ├───use-accessibility.ts - A hook for accessibility features.
    │   ├───use-ai-mode-manager.ts - A hook for managing AI modes.
    │   ├───use-audio-recording.ts - A hook for audio recording.
    │   ├───use-auto-scroll.ts - A hook for auto-scrolling.
    │   ├───use-autosize-textarea.ts - A hook for auto-sizing textareas.
    │   ├───use-copy-to-clipboard.ts - A hook for copying to the clipboard.
    │   ├───use-debounced-status-update.ts - A hook for debounced status updates.
    │   ├───use-keyboard-navigation.ts - A hook for keyboard navigation.
    │   ├───use-mobile.ts - A hook for mobile-specific features.
    │   ├───use-toast.ts - A hook for displaying toasts.
    │   ├───use-virtual-scroll.ts - A hook for virtual scrolling.
    │   ├───useBibliographyGenerator.ts - A hook for generating bibliographies.
    │   ├───useCitationFormatter.ts - A hook for formatting citations.
    │   ├───useFeedbackLearning.ts - A hook for feedback learning.
    │   ├───usePrivacyManager.ts - A hook for managing privacy.
    │   └───useSearchAnalytics.ts - A hook for search analytics.
    ├───lib\ - Contains library code.
    │   ├───ai-error-handler.ts - Handles AI errors.
    │   ├───ai-infrastructure.ts - Infrastructure for AI features.
    │   ├───ai-interfaces.ts - Interfaces for AI features.
    │   ├───ai-performance-optimizer.ts - Optimizes AI performance.
    │   ├───ai-searcher-performance-optimizer.ts - Optimizes AI searcher performance.
    │   ├───ai-types.ts - Types for AI features.
    │   ├───audio-utils.ts - Utilities for audio.
    │   ├───content-retrieval-service.ts - Retrieves content.
    │   ├───idea-api.ts - API for ideas.
    │   ├───network-status-service.ts - Service for network status.
    │   ├───proofreader-error-handling.ts - Handles proofreader errors.
    │   ├───proofreader-performance-monitor.ts - Monitors proofreader performance.
    │   ├───proofreader-performance-optimizer.ts - Optimizes proofreader performance.
    │   ├───proofreader-recovery-service.ts - Service for proofreader recovery.
    │   ├───proofreader-type-validators.ts - Type validators for the proofreader.
    │   ├───reference-validation.ts - Validates references.
    │   └───utils.ts - Utility functions.
    ├───react-app\ - Contains the React application.
    │   ├───index.css - CSS for the application.
    │   ├───index.d.ts - TypeScript declarations for the application.
    │   ├───main.tsx - The main application component.
    │   ├───assets\ - Contains assets for the React application.
    │   ├───components\ - Contains components for the React application.
    │   ├───models\ - Contains models for the React application.
    │   └───pages\ - Contains pages for the React application.
    ├───tests\ - Contains tests.
    ├───utils\ - Contains utility functions.
    └───worker\ - Contains the worker code.
        ├───handlers\ - Contains worker handlers.
        ├───lib\ - Contains worker library code.
        └───types\ - Contains worker types.
```
