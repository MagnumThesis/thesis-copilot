# Design Document

## Overview

This design outlines a comprehensive refactoring strategy to break down large, monolithic files in the Thesis Copilot codebase into smaller, more manageable modules. The refactoring will focus on the largest files identified in the analysis, prioritizing maintainability, testability, and adherence to single responsibility principles.

### Target Files for Refactoring

Based on the analysis, the following files will be prioritized for refactoring:

1. **ai-types.ts** (1,398 lines) - Core type definitions
2. **citation-style-engine.ts** (1,719 lines) - Citation formatting logic
3. **google-scholar-client.ts** (1,517 lines) - Academic search client
4. **sidebar.tsx** (1,048 lines) - Complex UI component
5. **query-generation-engine.ts** (1,185 lines) - Search query logic
6. **concern-analysis-engine.ts** (1,076 lines) - Proofreading analysis
7. **enhanced-search-history-manager.ts** (1,059 lines) - Search history management

## Architecture

### Modular Organization Strategy

The refactoring will follow a domain-driven approach, organizing code by functional areas:

```
src/
├── lib/
│   ├── types/                    # Type definitions by domain
│   │   ├── ai-types/
│   │   ├── citation-types/
│   │   ├── search-types/
│   │   └── reference-types/
│   ├── citation/                 # Citation-related functionality
│   │   ├── formatters/
│   │   ├── styles/
│   │   └── validators/
│   ├── search/                   # Search-related functionality
│   │   ├── clients/
│   │   ├── engines/
│   │   └── history/
│   └── analysis/                 # Analysis engines
│       ├── concern/
│       ├── content/
│       └── feedback/
├── components/
│   ├── ui/
│   │   ├── sidebar/              # Sidebar component modules
│   │   ├── search/               # Search UI components
│   │   └── citation/             # Citation UI components
└── worker/
    ├── lib/
    │   ├── search/               # Worker search services
    │   ├── citation/             # Worker citation services
    │   └── analysis/             # Worker analysis services
```

## Components and Interfaces

### 1. Type System Refactoring

**Current State:** Single `ai-types.ts` file with 1,398 lines containing all type definitions.

**Target Structure:**
```
src/lib/types/
├── index.ts                      # Main exports
├── ai-types/
│   ├── index.ts
│   ├── ai-modes.ts              # AI operation modes and states
│   ├── ai-errors.ts             # AI error types and handling
│   └── ai-processing.ts         # Processing status and operations
├── citation-types/
│   ├── index.ts
│   ├── citation-styles.ts       # Citation style enums and configs
│   ├── reference-types.ts       # Reference type definitions
│   └── author-types.ts          # Author and contributor types
├── search-types/
│   ├── index.ts
│   ├── search-results.ts        # Search result interfaces
│   ├── search-filters.ts        # Filter and query types
│   └── search-analytics.ts      # Analytics and tracking types
└── shared/
    ├── index.ts
    ├── common.ts                # Common utility types
    └── validation.ts            # Validation result types
```

### 2. Citation Engine Refactoring

**Current State:** Single `citation-style-engine.ts` file with 1,719 lines.

**Target Structure:**
```
src/lib/citation/
├── index.ts                      # Main citation engine export
├── formatters/
│   ├── index.ts
│   ├── author-formatter.ts      # Author name formatting
│   ├── date-formatter.ts        # Date formatting utilities
│   └── title-formatter.ts       # Title formatting utilities
├── styles/
│   ├── index.ts
│   ├── apa-style.ts            # APA citation style
│   ├── mla-style.ts            # MLA citation style
│   ├── chicago-style.ts        # Chicago citation style
│   ├── harvard-style.ts        # Harvard citation style
│   └── ieee-style.ts           # IEEE citation style
├── validators/
│   ├── index.ts
│   ├── citation-validator.ts    # Citation validation logic
│   └── reference-validator.ts   # Reference validation logic
└── engines/
    ├── index.ts
    ├── citation-engine.ts       # Main citation engine
    └── bibliography-engine.ts   # Bibliography generation
```

### 3. Search Client Refactoring

**Current State:** Single `google-scholar-client.ts` file with 1,517 lines.

**Target Structure:**
```
src/lib/search/
├── index.ts
├── clients/
│   ├── index.ts
│   ├── google-scholar-client.ts # Core Google Scholar client
│   ├── rate-limiter.ts         # Rate limiting logic
│   └── error-handler.ts        # Search error handling
├── parsers/
│   ├── index.ts
│   ├── html-parser.ts          # HTML parsing utilities
│   └── result-parser.ts        # Result parsing logic
├── cache/
│   ├── index.ts
│   ├── search-cache.ts         # Search result caching
│   └── cache-manager.ts        # Cache management
└── utils/
    ├── index.ts
    ├── url-builder.ts          # URL construction utilities
    └── request-utils.ts        # HTTP request utilities
```

### 4. UI Component Refactoring

**Current State:** Large `sidebar.tsx` component with 1,048 lines.

**Target Structure:**
```
src/components/ui/sidebar/
├── index.ts                     # Main sidebar export
├── sidebar-provider.tsx        # Context provider
├── sidebar-context.ts          # Context definition
├── sidebar-trigger.tsx         # Trigger component
├── sidebar-content.tsx         # Content component
├── sidebar-header.tsx          # Header component
├── sidebar-footer.tsx          # Footer component
├── sidebar-menu.tsx            # Menu component
├── sidebar-item.tsx            # Menu item component
├── sidebar-group.tsx           # Group component
└── hooks/
    ├── use-sidebar.ts          # Sidebar hook
    └── use-sidebar-state.ts    # State management hook
```

## Data Models

### Type Organization Strategy

Types will be organized by domain with clear dependency hierarchies:

1. **Base Types** - Fundamental types used across domains
2. **Domain Types** - Specific to functional areas (AI, Citation, Search)
3. **Component Types** - UI component-specific interfaces
4. **API Types** - Request/response interfaces

### Export Strategy

Each module will have an `index.ts` file that provides a clean public API:

```typescript
// Example: src/lib/types/citation-types/index.ts
export * from './citation-styles';
export * from './reference-types';
export * from './author-types';
export type { CitationEngine, BibliographyOptions } from './engines';
```

## Error Handling

### Modular Error Handling Strategy

Error handling will be distributed across modules with consistent patterns:

1. **Domain-Specific Errors** - Each domain will define its own error types
2. **Error Boundaries** - React error boundaries for UI components
3. **Recovery Strategies** - Modular recovery mechanisms
4. **Logging Integration** - Consistent logging across modules

### Error Type Organization

```typescript
// Base error types
export abstract class BaseError extends Error {
  abstract readonly type: string;
  abstract readonly isRetryable: boolean;
}

// Domain-specific error extensions
export class CitationError extends BaseError {
  readonly type = 'citation_error';
  // ... specific properties
}

export class SearchError extends BaseError {
  readonly type = 'search_error';
  // ... specific properties
}
```

## Testing Strategy

### Test Organization

Tests will follow the same modular structure as the source code:

1. **Unit Tests** - Individual module testing
2. **Integration Tests** - Cross-module interaction testing
3. **Component Tests** - UI component testing
4. **End-to-End Tests** - Full workflow testing

### Test File Structure

```
src/
├── lib/
│   ├── citation/
│   │   ├── formatters/
│   │   │   ├── author-formatter.ts
│   │   │   └── __tests__/
│   │   │       └── author-formatter.test.ts
│   │   └── __tests__/
│   │       └── citation-engine.integration.test.ts
```

### Migration Testing Strategy

1. **Snapshot Testing** - Ensure output consistency during refactoring
2. **Behavioral Testing** - Verify all existing functionality is preserved
3. **Performance Testing** - Ensure refactoring doesn't degrade performance
4. **Bundle Size Testing** - Monitor impact on bundle size

## Implementation Phases

### Phase 1: Type System Refactoring
- Extract and organize type definitions
- Create domain-specific type modules
- Update imports across codebase

### Phase 2: Service Layer Refactoring
- Break down large service files
- Create modular service architecture
- Implement consistent error handling

### Phase 3: UI Component Refactoring
- Extract reusable sub-components
- Implement component composition patterns
- Maintain accessibility features

### Phase 4: Testing and Documentation
- Update test structure
- Create migration documentation
- Performance optimization

## Migration Strategy

### Backward Compatibility

During the refactoring process, backward compatibility will be maintained through:

1. **Re-export Patterns** - Original imports continue to work
2. **Gradual Migration** - Incremental updates to imports
3. **Deprecation Warnings** - Clear migration paths for deprecated imports

### Example Migration Pattern

```typescript
// Original: src/lib/ai-types.ts
export * from './types/ai-types';
export * from './types/citation-types';
export * from './types/search-types';

// Deprecated warning comments
/** @deprecated Use @/lib/types/ai-types instead */
export type { AIMode } from './types/ai-types';
```

## Performance Considerations

### Bundle Optimization

1. **Tree Shaking** - Ensure proper tree shaking with modular exports
2. **Code Splitting** - Enable better code splitting at module boundaries
3. **Lazy Loading** - Support lazy loading of large modules

### Runtime Performance

1. **Import Optimization** - Reduce unnecessary imports
2. **Circular Dependency Prevention** - Avoid circular dependencies
3. **Memory Management** - Proper cleanup in modular components

## Security Considerations

### Module Isolation

1. **Principle of Least Privilege** - Modules only access what they need
2. **Input Validation** - Consistent validation across modules
3. **Error Information Leakage** - Prevent sensitive information in errors

### API Surface Reduction

1. **Private Implementation Details** - Hide internal implementation
2. **Public API Documentation** - Clear documentation of public interfaces
3. **Version Compatibility** - Maintain API stability