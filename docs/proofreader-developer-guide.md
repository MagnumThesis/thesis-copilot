# Proofreader Tool Developer Guide

## Overview

The Proofreader Tool is a comprehensive AI-powered analysis system that provides structured feedback on thesis proposals. This guide covers the technical implementation, API endpoints, data models, and integration patterns for developers working with or extending the proofreader functionality.

## Architecture Overview

### System Components

```
Frontend (React)           Backend (Hono Worker)         External Services
├── Proofreader.tsx       ├── proofreader-ai.ts         ├── Google Generative AI
├── ConcernList.tsx       ├── concern-analysis-engine.ts├── Supabase Database
├── ConcernDetail.tsx     ├── concern-status-manager.ts └── Content Services
├── AnalysisProgress.tsx  └── proofreader-handlers.ts
└── Performance/Error
    Management Components
```

### Data Flow

1. **User Initiation**: User triggers analysis through UI
2. **Content Retrieval**: System fetches thesis content and idea definitions
3. **AI Processing**: Content analyzed through concern analysis engine
4. **Result Processing**: Concerns categorized and stored in database
5. **UI Update**: Results displayed with status management capabilities

## API Endpoints

### Analysis Endpoints

#### POST /api/proofreader/analyze

Initiates a new proofreading analysis for the specified conversation.

**Request Body:**
```typescript
interface ProofreaderAnalysisRequest {
  conversationId: string;
  documentContent: string;
  ideaDefinitions: IdeaDefinition[];
  analysisOptions?: AnalysisOptions;
}

interface AnalysisOptions {
  categories?: ConcernCategory[];
  minSeverity?: ConcernSeverity;
  includeGrammar?: boolean;
  academicLevel?: 'undergraduate' | 'graduate' | 'doctoral';
}
```

**Response:**
```typescript
interface ProofreaderAnalysisResponse {
  success: boolean;
  concerns?: ProofreadingConcern[];
  analysisMetadata?: AnalysisMetadata;
  error?: string;
}
```

**Example:**
```javascript
const response = await fetch('/api/proofreader/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'uuid-here',
    documentContent: 'thesis content...',
    ideaDefinitions: [...],
    analysisOptions: {
      includeGrammar: true,
      academicLevel: 'graduate'
    }
  })
});
```

#### GET /api/proofreader/concerns/:conversationId

Retrieves existing concerns for a conversation.

**Parameters:**
- `conversationId` (string): UUID of the conversation
- `status` (query, optional): Filter by concern status
- `category` (query, optional): Filter by concern category

**Response:**
```typescript
interface ConcernsResponse {
  success: boolean;
  concerns: ProofreadingConcern[];
  statistics?: ConcernStatistics;
  error?: string;
}
```

**Example:**
```javascript
// Get all concerns
const response = await fetch('/api/proofreader/concerns/uuid-here');

// Get only unaddressed concerns
const response = await fetch('/api/proofreader/concerns/uuid-here?status=to_be_done');
```

### Status Management Endpoints

#### PUT /api/proofreader/concerns/:concernId/status

Updates the status of a specific concern.

**Request Body:**
```typescript
interface ConcernStatusUpdate {
  status: ConcernStatus;
  notes?: string;
}
```

**Response:**
```typescript
interface StatusUpdateResponse {
  success: boolean;
  concern?: ProofreadingConcern;
  error?: string;
}
```

**Example:**
```javascript
const response = await fetch('/api/proofreader/concerns/concern-uuid/status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'addressed',
    notes: 'Fixed grammar issues in section 2'
  })
});
```

## Data Models

### Core Types

```typescript
// Main concern object
interface ProofreadingConcern {
  id: string;
  conversationId: string;
  category: ConcernCategory;
  severity: ConcernSeverity;
  title: string;
  description: string;
  location?: ContentLocation;
  suggestions?: string[];
  relatedIdeas?: string[];
  status: ConcernStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
enum ConcernCategory {
  CLARITY = 'clarity',
  COHERENCE = 'coherence',
  STRUCTURE = 'structure',
  ACADEMIC_STYLE = 'academic_style',
  CONSISTENCY = 'consistency',
  COMPLETENESS = 'completeness',
  CITATIONS = 'citations',
  GRAMMAR = 'grammar',
  TERMINOLOGY = 'terminology'
}

enum ConcernSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ConcernStatus {
  TO_BE_DONE = 'to_be_done',
  ADDRESSED = 'addressed',
  REJECTED = 'rejected'
}

// Content location for precise feedback
interface ContentLocation {
  section?: string;
  paragraph?: number;
  startPosition?: number;
  endPosition?: number;
  context?: string;
}
```

### Analysis Metadata

```typescript
interface AnalysisMetadata {
  totalConcerns: number;
  concernsByCategory: Record<ConcernCategory, number>;
  concernsBySeverity: Record<ConcernSeverity, number>;
  analysisTime: number;
  contentLength: number;
  ideaDefinitionsUsed: number;
  cacheUsed?: boolean;
  fallbackUsed?: boolean;
}
```

## Database Schema

### Tables

#### proofreading_concerns

```sql
CREATE TABLE proofreading_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  category concern_category NOT NULL,
  severity concern_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  suggestions TEXT[],
  related_ideas TEXT[],
  status concern_status NOT NULL DEFAULT 'to_be_done',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### proofreading_sessions

```sql
CREATE TABLE proofreading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content_hash VARCHAR(64) NOT NULL,
  analysis_metadata JSONB,
  concerns_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_proofreading_concerns_conversation_id ON proofreading_concerns(conversation_id);
CREATE INDEX idx_proofreading_concerns_status ON proofreading_concerns(status);
CREATE INDEX idx_proofreading_concerns_category ON proofreading_concerns(category);
CREATE INDEX idx_proofreading_concerns_severity ON proofreading_concerns(severity);
```

## Core Services

### Concern Analysis Engine

**Location:** `src/worker/lib/concern-analysis-engine.ts`

```typescript
class ConcernAnalysisEngine {
  async analyzeContent(
    content: string, 
    ideaDefinitions: IdeaDefinition[]
  ): Promise<ProofreadingConcern[]> {
    // AI-powered content analysis
    // Returns structured concerns
  }

  async categorizeContent(content: string): Promise<ContentAnalysis> {
    // Analyzes content structure and style
  }

  async validateAcademicStyle(content: string): Promise<AcademicStyleAnalysis> {
    // Checks academic writing standards
  }
}
```

### Concern Status Manager

**Location:** `src/worker/lib/concern-status-manager.ts`

```typescript
class ConcernStatusManager {
  async updateConcernStatus(
    concernId: string, 
    status: ConcernStatus
  ): Promise<void> {
    // Updates concern status in database
  }

  async getConcernsByStatus(
    conversationId: string, 
    status?: ConcernStatus
  ): Promise<ProofreadingConcern[]> {
    // Retrieves filtered concerns
  }

  async getConcernStatistics(
    conversationId: string
  ): Promise<ConcernStatistics> {
    // Returns concern statistics
  }
}
```

## Frontend Components

### Main Proofreader Component

**Location:** `src/components/ui/proofreader.tsx`

```typescript
interface ProofreaderProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversation: { title: string; id: string };
}

export const Proofreader: React.FC<ProofreaderProps> = ({
  isOpen,
  onClose,
  currentConversation
}) => {
  // Component implementation
};
```

### Key Features

- **Real-time Analysis**: Progress tracking with cancellation support
- **Status Management**: Optimistic updates with error recovery
- **Offline Support**: Cached results and offline functionality
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance**: Debounced updates and virtual scrolling

## Integration Patterns

### Content Retrieval Service

```typescript
// Retrieve content from Builder tool
const contentResult = await contentRetrievalService.retrieveAllContent(conversationId);

// Check integration status
const integrationStatus = await contentRetrievalService.getIntegrationStatus(conversationId);
```

### Error Handling

```typescript
// Classify and handle errors
const classifiedError = proofreaderErrorHandler.classifyError(error, 'analysis', conversationId);

// Execute with retry logic
const result = await proofreaderErrorHandler.executeWithRetry(
  operation,
  operationType,
  retryOptions,
  conversationId
);
```

### Performance Optimization

```typescript
// Cached analysis
const cachedResult = proofreaderPerformanceOptimizer.getCachedAnalysis(request);

// Optimized analysis with caching
const result = await proofreaderPerformanceOptimizer.optimizedAnalysis(
  request,
  analysisFunction,
  options
);
```

## Testing

### Unit Tests

```typescript
describe('ConcernAnalysisEngine', () => {
  it('should generate relevant concerns for thesis content', async () => {
    const engine = new ConcernAnalysisEngine();
    const concerns = await engine.analyzeContent(sampleContent, ideaDefinitions);
    expect(concerns).toHaveLength(greaterThan(0));
    expect(concerns[0]).toHaveProperty('category');
  });
});
```

### Integration Tests

```typescript
describe('Proofreader API', () => {
  it('should handle complete analysis workflow', async () => {
    const response = await request(app)
      .post('/api/proofreader/analyze')
      .send(analysisRequest)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.concerns).toBeDefined();
  });
});
```

### End-to-End Tests

```typescript
describe('Proofreader E2E', () => {
  it('should complete full analysis workflow', async () => {
    // Test complete user workflow
    await page.click('[data-testid="analyze-button"]');
    await page.waitForSelector('[data-testid="concern-list"]');
    
    const concerns = await page.$$('[data-testid="concern-item"]');
    expect(concerns.length).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

### Caching Strategy

- **Analysis Results**: Cache based on content hash
- **Concern Data**: Local browser cache for offline access
- **AI Responses**: Cache similar analysis requests

### Optimization Techniques

- **Debounced Updates**: Prevent excessive API calls
- **Virtual Scrolling**: Handle large concern lists
- **Lazy Loading**: Load components only when needed
- **Batch Operations**: Group status updates

## Error Handling and Recovery

### Error Types

```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AI_SERVICE_ERROR = 'ai_service_error',
  DATABASE_ERROR = 'database_error',
  VALIDATION_ERROR = 'validation_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}
```

### Recovery Strategies

- **Automatic Retry**: Exponential backoff for transient errors
- **Offline Mode**: Basic analysis without AI service
- **Cached Fallback**: Use previous results when service unavailable
- **Graceful Degradation**: Reduced functionality rather than failure

## Security Considerations

### Input Validation

```typescript
// Validate analysis request
const validatedRequest = proofreaderTypeValidators.validateAnalysisRequest(request);

// Sanitize content before AI processing
const sanitizedContent = sanitizeContent(documentContent);
```

### Access Control

- **Conversation Ownership**: Verify user owns conversation
- **Rate Limiting**: Prevent abuse of AI services
- **Content Filtering**: Remove sensitive information

### Data Privacy

- **Encryption**: Encrypt sensitive content in transit
- **No Permanent Storage**: Don't store analysis content long-term
- **Audit Logging**: Log access and modifications

## Deployment and Configuration

### Environment Variables

```bash
# AI Service Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
PROOFREADER_AI_MODEL=gemini-pro

# Database Configuration
DATABASE_URL=your-supabase-url
DATABASE_ANON_KEY=your-anon-key

# Performance Settings
PROOFREADER_CACHE_TTL=3600
PROOFREADER_MAX_CONTENT_LENGTH=50000
```

### Feature Flags

```typescript
interface ProofreaderConfig {
  enableAdvancedAnalysis: boolean;
  enableOfflineMode: boolean;
  enablePerformanceOptimization: boolean;
  maxConcernsPerAnalysis: number;
  cacheExpirationTime: number;
}
```

## Migration Guide

### Database Migrations

Run the following migrations to set up proofreader functionality:

```bash
# Apply v3 migration for proofreading tables
psql -d your_database -f migrations/v3_create_proofreading_tables.sql

# Verify migration
psql -d your_database -c "SELECT * FROM proofreading_concerns LIMIT 1;"
```

### Upgrading from Previous Versions

1. **Database Schema**: Apply new migrations
2. **API Changes**: Update client code for new endpoints
3. **Configuration**: Add new environment variables
4. **Dependencies**: Update package versions

## Troubleshooting

### Common Issues

#### High Memory Usage
- **Cause**: Large concern lists or content
- **Solution**: Implement virtual scrolling, limit analysis scope

#### Slow Analysis Performance
- **Cause**: Large content, poor network, AI service latency
- **Solution**: Content chunking, caching, fallback analysis

#### Database Connection Issues
- **Cause**: Network problems, database overload
- **Solution**: Connection pooling, retry logic, offline mode

### Debugging Tools

```typescript
// Enable debug logging
localStorage.setItem('proofreader-debug', 'true');

// Performance monitoring
proofreaderPerformanceMonitor.startMeasure('operation-name');
// ... operation
const duration = proofreaderPerformanceMonitor.endMeasure('operation-name');
```

## Contributing

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow project linting rules
- **Testing**: Maintain >90% test coverage
- **Documentation**: Update docs for API changes

### Development Workflow

1. **Feature Branch**: Create branch from main
2. **Implementation**: Follow existing patterns
3. **Testing**: Add comprehensive tests
4. **Documentation**: Update relevant docs
5. **Review**: Submit pull request

## API Reference Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/proofreader/analyze` | POST | Start new analysis |
| `/api/proofreader/concerns/:id` | GET | Get concerns |
| `/api/proofreader/concerns/:id/status` | PUT | Update status |

## Version History

- **v1.0**: Initial implementation with core analysis features
- **v1.1**: Added offline support and performance optimizations
- **v1.2**: Enhanced error handling and recovery mechanisms

---

*Last updated: [Current Date]*
*Version: 1.0*