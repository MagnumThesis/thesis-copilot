# AI Searcher Component Refactor - Design Document

## Overview

The AISearcher component in `src/components/ui/ai-searcher.tsx` is a comprehensive AI-powered academic reference search interface with over 1000 lines of code. The component has become difficult to maintain and understand due to its monolithic structure. This design document outlines a plan to refactor the component into smaller, more manageable pieces while preserving all existing functionality.

The refactor will focus on separating concerns by extracting logical sections of the component into smaller, reusable components. Additionally, we will improve state management organization, centralize API interactions, and enhance testability.

## Architecture

The refactored AISearcher will follow a modular architecture with the following key principles:

1. **Component Separation**: Extract logical sections into dedicated components
2. **State Management**: Organize related state variables and extract complex logic into custom hooks
3. **API Centralization**: Move all API calls to a dedicated service module
4. **Maintainability**: Ensure each component has a single responsibility

The high-level architecture will be:

```
AISearcher (main component)
├── Search Header
├── Privacy Management
├── Content Source Management
├── Query Management
├── Search Execution
├── Results Management
├── Feedback Management
└── Child Components (already existing)
    ├── ContentSourceSelector
    ├── QueryRefinementPanel
    ├── SearchFiltersPanel
    ├── SearchResultsDisplay
    ├── DuplicateConflictResolver
    ├── DeduplicationSettings
    ├── SearchSessionFeedbackComponent
    └── PrivacyControls
```

## Components and Interfaces

### 1. Main AISearcher Component
The main component will be simplified to coordinate between the major sections and manage only high-level state.

**Props:**
- `conversationId: string`
- `onAddReference?: (reference: Partial<Reference>) => void`

### 2. Search Header Component
Responsible for the top section of the UI including the title and privacy button.

### 3. Privacy Management Component
Handles privacy banner and controls visibility.

### 4. Content Source Management Component
Manages the content selection toggle and selected content summary.

### 5. Query Management Component
Handles the search input, filters button, refine button, and search button.

### 6. Search Execution Component
Handles the search logic, API calls, and result processing.

### 7. Results Management Component
Handles the display of search results, duplicate detection, and session feedback.

### 8. API Service Module
Centralized module for all API interactions:
- `/api/ai-searcher/search`
- `/api/referencer/add-from-search`
- `/api/ai-searcher/refine-query`
- `/api/ai-searcher/feedback/result`
- `/api/ai-searcher/feedback/session`

## Data Models

### State Organization

The current flat state structure will be organized into logical groups:

1. **Privacy State**
   - `privacyManager`
   - `showPrivacyControls`

2. **Search State**
   - `searchQuery`
   - `loading`
   - `hasSearched`
   - `searchError`
   - `currentSessionId`

3. **Content State**
   - `showContentSelector`
   - `selectedContent`
   - `contentPreview`

4. **Query Refinement State**
   - `showQueryRefinement`
   - `queryRefinement`
   - `refinementLoading`

5. **Duplicate Detection State**
   - `duplicateGroups`
   - `showDuplicateResolver`
   - `showDeduplicationSettings`
   - `deduplicationOptions`
   - `duplicateDetectionEngine`
   - `originalResults`
   - `duplicatesDetected`

6. **Feedback State**
   - `showSessionFeedback`
   - `sessionFeedbackSubmitted`

7. **Filters State**
   - `searchFilters`
   - `showFilters`

### Extracted Interfaces

Several interfaces are already defined, but we'll ensure they're properly organized:

1. `AISearcherProps` - Component props
2. `SearchResult` - Search result structure
3. API request/response interfaces for each endpoint

## Error Handling

Error handling will be standardized across all API calls:

1. **API Errors**: Consistent error handling with user-friendly messages
2. **Validation Errors**: Clear feedback for invalid inputs
3. **Network Errors**: Graceful handling of connectivity issues
4. **Fallbacks**: Maintain mock data implementations for development/testing

Each API service method will return a standardized response object:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Testing Strategy

### Unit Tests
1. **Component Tests**: Test each extracted component in isolation
2. **Hook Tests**: Test custom hooks for state management
3. **Service Tests**: Test API service methods with mocked fetch

### Integration Tests
1. **Component Integration**: Test how components work together
2. **API Integration**: Test API service with mocked endpoints

### Test Structure
1. **Component Tests**: Use React Testing Library for UI component testing
2. **Hook Tests**: Use React Hooks Testing Library
3. **Service Tests**: Use Jest with mocked fetch API

Each component will be exported for testing purposes, and business logic will be separated from UI logic to enable comprehensive unit testing.

## Design Decisions and Rationales

1. **Component Extraction**: Rather than creating entirely new components, we'll extract logical sections of the existing component to maintain consistency while improving maintainability.

2. **State Management**: Related state variables will be grouped together to make the code more readable and easier to debug.

3. **API Centralization**: Moving all API calls to a dedicated service module will make network requests easier to manage, test, and maintain.

4. **Preserve Existing Child Components**: We'll continue to use the existing child components like `ContentSourceSelector`, `QueryRefinementPanel`, etc., as they are already well-structured.

5. **Maintain UI/UX Consistency**: The refactor will not change the visual appearance or user experience, ensuring users see no difference in how the component functions.