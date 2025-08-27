# Design Document

## Overview

This design outlines the refactoring strategy for breaking down large, monolithic files in the codebase into smaller, focused modules. The refactoring will follow the Single Responsibility Principle and maintain backward compatibility while improving maintainability, testability, and code organization.

The primary targets are:
- `use-ai-mode-manager.ts` (1,233 lines) - AI mode state management hook
- `ai-searcher-api.ts` (2,714 lines) - API route handlers and service orchestration
- `ai-error-handler.ts` (785 lines) - Comprehensive error handling utilities
- `ai-performance-optimizer.ts` (665 lines) - Performance optimization and caching

## Architecture

### Modular Hook Architecture for `use-ai-mode-manager.ts`

The current monolithic hook will be decomposed into a composition of smaller, focused hooks:

```
useAIModeManager (main hook)
├── useAIModeState (mode and processing state)
├── useAIErrorState (error handling state)
├── useAIModifyModeState (modify mode specific state)
├── useAIPerformanceState (performance metrics and optimistic updates)
├── useAIOperations (AI API operations)
└── useAISelectionManager (text selection management)
```

### Service Layer Architecture for `ai-searcher-api.ts`

The monolithic API handler will be split into focused route handlers and service layers:

```
ai-searcher-api.ts (main router)
├── routes/
│   ├── search-routes.ts (search, extract endpoints)
│   ├── query-routes.ts (generate-query, validate-query, etc.)
│   ├── history-routes.ts (history management endpoints)
│   ├── analytics-routes.ts (analytics and tracking endpoints)
│   └── feedback-routes.ts (feedback and learning endpoints)
├── services/
│   ├── search-service.ts (search orchestration)
│   ├── query-service.ts (query generation and refinement)
│   ├── analytics-service.ts (analytics processing)
│   └── content-service.ts (content extraction and processing)
└── middleware/
    ├── validation-middleware.ts (request validation)
    └── error-middleware.ts (error handling)
```

### Error Handling Module Architecture

The error handler will be split into focused modules:

```
ai-error-handler.ts (main orchestrator)
├── network-error-handler.ts (network-specific error handling)
├── validation-error-handler.ts (input validation errors)
├── recovery-strategy-manager.ts (error recovery strategies)
└── error-context-manager.ts (error context and logging)
```

### Performance Optimization Module Architecture

The performance optimizer will be decomposed into specialized modules:

```
ai-performance-optimizer.ts (main orchestrator)
├── cache-manager.ts (caching logic and strategies)
├── debounce-manager.ts (request debouncing)
├── metrics-collector.ts (performance metrics)
└── optimization-strategies.ts (content and context optimization)
```

## Components and Interfaces

### Hook Composition Pattern

Each extracted hook will follow a consistent pattern:

```typescript
// Base hook interface pattern
interface UseHookName {
  // State properties
  // Action methods
  // Computed properties
}

// Implementation pattern
export function useHookName(dependencies: Dependencies): UseHookName {
  // Internal state
  // Effect handlers
  // Computed values
  // Return interface
}
```

### Service Layer Interfaces

Route handlers will follow a consistent service pattern:

```typescript
// Service interface pattern
interface ServiceName {
  methodName(context: Context): Promise<Response>;
}

// Route handler pattern
export class RouteHandlerName {
  constructor(private services: ServiceDependencies) {}
  
  async handleEndpoint(c: Context): Promise<Response> {
    // Validation
    // Service orchestration
    // Response formatting
  }
}
```

### Configuration Management

Configuration will be extracted into dedicated modules:

```typescript
// Configuration interface
interface ModuleConfig {
  // Typed configuration properties
}

// Configuration provider
export class ConfigManager {
  static getConfig<T>(moduleName: string): T;
  static validateConfig<T>(config: T, schema: Schema): boolean;
}
```

## Data Models

### Hook State Models

```typescript
// AI Mode State
interface AIModeState {
  currentMode: AIMode;
  canActivateMode: (mode: AIMode) => boolean;
}

// Processing State
interface AIProcessingState {
  isProcessing: boolean;
  progress?: number;
  statusMessage?: string;
}

// Error State
interface AIErrorState {
  hasError: boolean;
  error: AIError | null;
  recoveryStrategy: ErrorRecoveryStrategy | null;
  canRetry: boolean;
  retryCount: number;
}

// Modify Mode State
interface AIModifyModeState {
  showModificationTypeSelector: boolean;
  showModificationPreview: boolean;
  showCustomPromptInput: boolean;
  currentModificationType: ModificationType | null;
  modificationPreviewContent: string | null;
  originalTextForModification: string | null;
  customPrompt: string | null;
}
```

### Service Layer Models

```typescript
// Request/Response models for each service
interface SearchServiceRequest {
  query: string;
  conversationId: string;
  filters?: SearchFilters;
  options?: SearchOptions;
}

interface SearchServiceResponse {
  results: SearchResult[];
  metadata: SearchMetadata;
  analytics: SearchAnalytics;
}
```

### Configuration Models

```typescript
// Module-specific configurations
interface AIModeManagerConfig {
  maxRetries?: number;
  timeout?: number;
  debounceMs?: number;
  enableGracefulDegradation?: boolean;
  showErrorNotifications?: boolean;
  enableCaching?: boolean;
  enableOptimisticUpdates?: boolean;
  enableContextOptimization?: boolean;
}

interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  maxAccessCount: number;
}

interface DebounceConfig {
  delayMs: number;
  maxWaitMs: number;
}
```

## Error Handling

### Centralized Error Management

Each module will implement consistent error handling:

```typescript
// Module-specific error types
enum ModuleErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}

// Error handling interface
interface ModuleErrorHandler {
  handleError(error: Error, context: ErrorContext): void;
  createRecoveryStrategy(error: Error): RecoveryStrategy;
  shouldRetry(error: Error, retryCount: number): boolean;
}
```

### Error Propagation Strategy

- Module-level errors are handled locally when possible
- Critical errors are propagated to parent modules
- User-facing errors include recovery suggestions
- All errors are logged with appropriate context

## Testing Strategy

### Unit Testing Approach

Each extracted module will have comprehensive unit tests:

```typescript
// Hook testing pattern
describe('useAIModeState', () => {
  it('should manage mode transitions correctly', () => {
    // Test mode state management
  });
  
  it('should validate mode activation conditions', () => {
    // Test validation logic
  });
});

// Service testing pattern
describe('SearchService', () => {
  it('should process search requests correctly', () => {
    // Test service logic
  });
  
  it('should handle errors gracefully', () => {
    // Test error scenarios
  });
});
```

### Integration Testing Strategy

- Test hook composition in the main `useAIModeManager`
- Test service orchestration in route handlers
- Test error handling across module boundaries
- Test performance optimizations end-to-end

### Testing Utilities

Create shared testing utilities for common patterns:

```typescript
// Hook testing utilities
export function renderHookWithProviders<T>(
  hook: () => T,
  providers: TestProviders
): RenderHookResult<T>;

// Service testing utilities
export function createMockContext(
  request: Partial<Request>
): MockContext;

// Error testing utilities
export function createTestError(
  type: ErrorType,
  options?: ErrorOptions
): TestError;
```

## Migration Strategy

### Phase 1: Extract Utility Functions
- Extract pure utility functions first
- Create shared utility modules
- Update imports in existing files

### Phase 2: Extract Configuration
- Move configuration objects to dedicated modules
- Create configuration validation
- Update configuration usage

### Phase 3: Extract Specialized Modules
- Extract error handling modules
- Extract performance optimization modules
- Extract service layer modules

### Phase 4: Refactor Main Files
- Refactor `use-ai-mode-manager.ts` to use extracted hooks
- Refactor `ai-searcher-api.ts` to use extracted services
- Update main orchestrator classes

### Phase 5: Testing and Validation
- Ensure all existing tests pass
- Add comprehensive tests for new modules
- Validate performance impact
- Update documentation

## Backward Compatibility

### API Preservation
- All public interfaces remain unchanged
- Existing function signatures are maintained
- Import paths for main modules stay the same

### Gradual Migration
- New modules are added alongside existing code
- Main modules are refactored to use new modules internally
- Old code paths are deprecated gradually

### Version Management
- Use semantic versioning for internal modules
- Maintain compatibility matrices
- Provide migration guides for internal consumers