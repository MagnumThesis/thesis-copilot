# AI Reference Searcher Configuration Guide

This guide explains how to configure and customize the AI Reference Searcher feature.

## Environment Variables

The AI Reference Searcher requires the following environment variables:

### Required Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON=your_supabase_anon_key
```

### Optional Variables
```env
# Google Scholar Client Configuration
GOOGLE_SCHOLAR_RATE_LIMIT_PER_MINUTE=8
GOOGLE_SCHOLAR_RATE_LIMIT_PER_HOUR=80
GOOGLE_SCHOLAR_MAX_RETRIES=3
GOOGLE_SCHOLAR_BASE_DELAY_MS=2000
GOOGLE_SCHOLAR_MAX_DELAY_MS=30000

# Fallback Configuration
FALLBACK_ENABLED=true
FALLBACK_SOURCES=semantic-scholar,crossref
MAX_FALLBACK_ATTEMPTS=2

# Error Handling
DETAILED_ERROR_LOGGING=true
```

## Rate Limiting Configuration

The Google Scholar client implements conservative rate limiting to ensure fair usage:

### Default Settings
```typescript
const defaultRateLimitConfig = {
  requestsPerMinute: 8,
  requestsPerHour: 80,
  maxRetries: 3,
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true
};
```

### Customizing Rate Limits
To modify rate limits, update the configuration when initializing the GoogleScholarClient:

```typescript
const client = new GoogleScholarClient({
  requestsPerMinute: 10,
  requestsPerHour: 100,
  maxRetries: 5
});
```

## Fallback Service Configuration

The system includes fallback services for when Google Scholar is unavailable:

### Default Settings
```typescript
const defaultFallbackConfig = {
  enabled: true,
  fallbackSources: ['semantic-scholar', 'crossref'],
  maxFallbackAttempts: 2
};
```

### Disabling Fallback
To disable fallback services:
```typescript
const client = new GoogleScholarClient(
  undefined,
  {
    enabled: false
  }
);
```

## Error Handling Configuration

Customize error messages and handling behavior:

### Default Settings
```typescript
const defaultErrorHandlingConfig = {
  enableDetailedLogging: true,
  customErrorMessages: {
    'rate_limit': 'Search rate limit exceeded. Please wait before trying again.',
    'network': 'Network connection error. Please check your internet connection.',
    'parsing': 'Unable to parse search results. The service may be temporarily unavailable.',
    'blocked': 'Access to Google Scholar is currently blocked. Please try again later.',
    'timeout': 'Search request timed out. Please try again.',
    'service_unavailable': 'Google Scholar is temporarily unavailable. Trying alternative sources.',
    'quota_exceeded': 'Daily search quota exceeded. Please try again tomorrow.'
  }
};
```

### Custom Error Messages
To customize error messages:
```typescript
const client = new GoogleScholarClient(
  undefined,
  undefined,
  {
    customErrorMessages: {
      'rate_limit': 'Please wait before searching again.',
      'network': 'Check your internet connection.'
    }
  }
);
```

## Search Result Scoring Configuration

Customize how search results are scored and ranked:

### Default Weights
```typescript
const defaultWeights = {
  relevance: 0.5,
  quality: 0.3,
  confidence: 0.2
};
```

### Custom Weights
To emphasize quality over relevance:
```typescript
const customWeights = {
  relevance: 0.3,
  quality: 0.5,
  confidence: 0.2
};

const results = scoringEngine.rankResults(
  searchResults,
  extractedContent,
  customWeights
);
```

## Query Generation Configuration

Customize query generation behavior:

### Default Options
```typescript
const defaultQueryOptions = {
  maxKeywords: 8,
  maxTopics: 5,
  includeAlternatives: false,
  optimizeForAcademic: true,
  combineStrategy: 'weighted'
};
```

### Academic Terms
The system includes a default set of academic terms for query optimization:
```typescript
const academicTerms = new Set([
  'research', 'study', 'analysis', 'methodology', 'framework', 'approach',
  'theory', 'model', 'system', 'process', 'development', 'implementation',
  'evaluation', 'assessment', 'investigation', 'examination', 'exploration',
  'findings', 'results', 'conclusion', 'evidence', 'data', 'empirical',
  'systematic', 'comprehensive', 'comparative', 'experimental', 'qualitative',
  'quantitative', 'statistical', 'analytical', 'theoretical', 'practical'
]);
```

## Performance Optimization Configuration

Configure caching and background processing:

### Cache Settings
```typescript
const cacheConfig = {
  searchResults: {
    maxSize: 200,
    ttlMs: 3600000, // 1 hour
    maxAccessCount: 10
  },
  contentExtraction: {
    maxSize: 500,
    ttlMs: 14400000, // 4 hours
    maxAccessCount: 20
  },
  queryGeneration: {
    maxSize: 300,
    ttlMs: 7200000, // 2 hours
    maxAccessCount: 15
  }
};
```

### Background Processing
```typescript
// Configure background task processing
const backgroundTaskConfig = {
  processingIntervalMs: 1000,
  maxConcurrentTasks: 3,
  taskPriority: {
    content_extraction: 'low',
    query_generation: 'medium',
    search_preload: 'high'
  }
};
```

## Privacy Configuration

Configure privacy and data retention settings:

### Default Privacy Settings
```typescript
const defaultPrivacySettings = {
  searchHistoryRetentionDays: 30,
  analyticsDataRetentionDays: 90,
  autoClearSearchHistory: false,
  exportFormat: 'json'
};
```

### User Consent Management
```typescript
const consentConfig = {
  requiredForAIFeatures: true,
  consentTypes: [
    'search_history',
    'analytics_collection',
    'feedback_sharing'
  ],
  defaultConsent: false
};
```

## UI Customization

Customize the user interface appearance and behavior:

### Theme Configuration
```typescript
const themeConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  accentColor: '#8b5cf6',
  errorColor: '#ef4444',
  successColor: '#10b981',
  warningColor: '#f59e0b'
};
```

### Display Options
```typescript
const displayOptions = {
  resultsPerPage: 10,
  maxResultsToShow: 100,
  showConfidenceIndicators: true,
  showDetailedScores: true,
  enableProgressiveLoading: true,
  progressiveLoadingBatchSize: 10
};
```

## Advanced Configuration

### Custom Academic Terms
To add domain-specific academic terms:
```typescript
// In QueryGenerationEngine
const customAcademicTerms = new Set([
  ...academicTerms,
  'neural_network',
  'deep_learning',
  'natural_language_processing',
  'computer_vision'
]);
```

### Journal Quality Rankings
To customize journal quality scoring:
```typescript
// In ResultScoringEngine
const customHighImpactJournals = new Set([
  ...highImpactJournals,
  'Your Domain Specific Journal',
  'Another Important Journal'
]);
```

### Author Authority Scoring
To customize author authority metrics:
```typescript
// In ResultScoringEngine
const academicCredentials = [
  'prof',
  'professor',
  'dr',
  'phd',
  'md',
  'ph.d',
  'm.d'
];

const institutionalAffiliations = [
  'university',
  'institute',
  'college',
  'lab',
  'laboratory'
];
```

## API Configuration

Configure API endpoints and behavior:

### Base URLs
```typescript
const apiConfig = {
  baseUrl: '/api/ai-searcher',
  googleScholarBaseUrl: 'https://scholar.google.com/scholar',
  fallbackBaseUrls: {
    'semantic-scholar': 'https://api.semanticscholar.org/graph/v1',
    'crossref': 'https://api.crossref.org/works'
  }
};
```

### Timeout Settings
```typescript
const timeoutConfig = {
  searchTimeoutMs: 30000,
  extractionTimeoutMs: 15000,
  queryGenerationTimeoutMs: 10000,
  feedbackTimeoutMs: 5000
};
```

## Monitoring and Logging

Configure monitoring and logging behavior:

### Log Levels
```typescript
const logConfig = {
  enableDetailedLogging: true,
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  logToFile: false,
  maxLogFileSize: 10485760 // 10MB
};
```

### Performance Monitoring
```typescript
const performanceConfig = {
  trackMetrics: true,
  metricsCollectionIntervalMs: 60000, // 1 minute
  performanceThresholds: {
    searchTimeWarningMs: 5000,
    searchTimeErrorMs: 10000,
    extractionTimeWarningMs: 3000,
    extractionTimeErrorMs: 5000
  }
};
```

## Testing Configuration

Configure testing behavior and mock data:

### Test Settings
```typescript
const testConfig = {
  useMockData: false,
  mockSearchResults: [],
  mockExtractionResults: [],
  simulateNetworkDelay: false,
  networkDelayMs: 1000
};
```

### CI/CD Configuration
```typescript
const ciConfig = {
  runPerformanceTests: true,
  performanceTestThresholdMs: 5000,
  runIntegrationTests: true,
  integrationTestTimeoutMs: 30000
};
```

## Deployment Configuration

Configure deployment-specific settings:

### Production Settings
```typescript
const productionConfig = {
  enableCaching: true,
  cacheTTL: 3600000,
  enableBackgroundProcessing: true,
  maxConcurrentRequests: 10,
  enableRateLimiting: true
};
```

### Development Settings
```typescript
const developmentConfig = {
  enableCaching: false,
  logLevel: 'debug',
  enableMockData: true,
  simulateNetworkConditions: false
};
```

## Security Configuration

Configure security-related settings:

### Content Security
```typescript
const securityConfig = {
  sanitizeUserInput: true,
  maxQueryLength: 200,
  allowedSearchOperators: ['AND', 'OR', 'NOT'],
  enableXSSProtection: true
};
```

### Data Protection
```typescript
const dataProtectionConfig = {
  encryptSearchHistory: true,
  encryptAnalyticsData: true,
  dataRetentionPeriodDays: 365,
  autoDeleteInactiveData: true
};
```

## Integration Configuration

Configure integration with other system components:

### Reference Manager Integration
```typescript
const referenceManagerConfig = {
  autoPopulateMetadata: true,
  checkForDuplicates: true,
  duplicateHandling: 'prompt_user',
  minConfidenceForAutoAdd: 0.7
};
```

### Citation Style Integration
```typescript
const citationConfig = {
  supportedStyles: ['apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver'],
  defaultStyle: 'apa',
  enableStyleDetection: true
};
```

## Migration Configuration

Configure settings for migrating from previous versions:

### Migration Settings
```typescript
const migrationConfig = {
  migrateSearchHistory: true,
  migratePreferences: true,
  migrateAnalytics: true,
  backupBeforeMigration: true
};
```

## Best Practices

### Performance Optimization
1. Adjust cache sizes based on typical usage patterns
2. Configure rate limits appropriate for your user base
3. Enable background processing for better user experience
4. Monitor performance metrics regularly

### Security
1. Keep academic terms lists updated for your domain
2. Regularly review and update fallback service configurations
3. Implement proper input sanitization
4. Use encryption for sensitive data

### Usability
1. Customize error messages for your user base
2. Adjust display options for optimal user experience
3. Configure privacy settings according to user preferences
4. Provide clear feedback mechanisms

### Maintenance
1. Regularly review and update configuration settings
2. Monitor system performance and adjust as needed
3. Keep documentation updated with configuration changes
4. Test configuration changes in a staging environment first