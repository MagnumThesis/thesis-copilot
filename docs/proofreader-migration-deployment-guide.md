# Proofreader Tool Migration and Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Proofreader Tool feature to production environments, including database migrations, configuration updates, and verification procedures.

## Prerequisites

Before deploying the Proofreader Tool, ensure you have:

- **Database Access**: Administrative access to your Supabase/PostgreSQL database
- **Environment Configuration**: Access to update environment variables
- **API Keys**: Google Generative AI API key for AI analysis functionality
- **Backup Strategy**: Current database backup before applying migrations
- **Testing Environment**: Staging environment for pre-production testing

## Database Migration

### Step 1: Backup Current Database

```bash
# Create a backup before migration
pg_dump -h your-db-host -U your-username -d your-database > backup_pre_proofreader_$(date +%Y%m%d_%H%M%S).sql

# For Supabase users
supabase db dump --db-url "your-connection-string" > backup_pre_proofreader_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Apply Migration Scripts

#### Option A: Using Migration Files (Recommended)

```bash
# Navigate to your project directory
cd /path/to/thesis-copilot

# Apply the v3 migration for proofreading tables
psql -h your-db-host -U your-username -d your-database -f migrations/v3_create_proofreading_tables.sql

# Verify migration was successful
psql -h your-db-host -U your-username -d your-database -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('proofreading_concerns', 'proofreading_sessions');"
```

#### Option B: Manual SQL Execution

If you prefer to run the migration manually:

```sql
-- Connect to your database and run the following:

-- Create concern categories enum
CREATE TYPE concern_category AS ENUM (
  'clarity',
  'coherence', 
  'structure',
  'academic_style',
  'consistency',
  'completeness',
  'citations',
  'grammar',
  'terminology'
);

-- Create concern severity enum
CREATE TYPE concern_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Create concern status enum
CREATE TYPE concern_status AS ENUM (
  'to_be_done',
  'addressed',
  'rejected'
);

-- Create proofreading concerns table
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

-- Create proofreading sessions table
CREATE TABLE proofreading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content_hash VARCHAR(64) NOT NULL,
  analysis_metadata JSONB,
  concerns_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_proofreading_concerns_conversation_id ON proofreading_concerns(conversation_id);
CREATE INDEX idx_proofreading_concerns_status ON proofreading_concerns(status);
CREATE INDEX idx_proofreading_concerns_category ON proofreading_concerns(category);
CREATE INDEX idx_proofreading_concerns_severity ON proofreading_concerns(severity);
CREATE INDEX idx_proofreading_concerns_created_at ON proofreading_concerns(created_at);

CREATE INDEX idx_proofreading_sessions_conversation_id ON proofreading_sessions(conversation_id);
CREATE INDEX idx_proofreading_sessions_content_hash ON proofreading_sessions(content_hash);
CREATE INDEX idx_proofreading_sessions_created_at ON proofreading_sessions(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proofreading_concerns_updated_at 
    BEFORE UPDATE ON proofreading_concerns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Verify Migration

```sql
-- Verify tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name LIKE 'proofreading_%';

-- Verify enums were created
SELECT enumname, enumlabel 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname IN ('concern_category', 'concern_severity', 'concern_status');

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'proofreading_%';

-- Test basic operations
INSERT INTO proofreading_concerns (
  conversation_id, 
  category, 
  severity, 
  title, 
  description
) VALUES (
  gen_random_uuid(), 
  'clarity', 
  'medium', 
  'Test Concern', 
  'Test Description'
);

SELECT COUNT(*) FROM proofreading_concerns;

-- Clean up test data
DELETE FROM proofreading_concerns WHERE title = 'Test Concern';
```

## Environment Configuration

### Step 1: Update Environment Variables

Add the following environment variables to your deployment configuration:

```bash
# AI Service Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-api-key-here
PROOFREADER_AI_MODEL=gemini-pro

# Performance Settings (optional)
PROOFREADER_CACHE_TTL=3600
PROOFREADER_MAX_CONTENT_LENGTH=50000
PROOFREADER_MAX_CONCERNS_PER_ANALYSIS=100

# Feature Flags (optional)
PROOFREADER_ENABLE_ADVANCED_ANALYSIS=true
PROOFREADER_ENABLE_OFFLINE_MODE=true
PROOFREADER_ENABLE_PERFORMANCE_OPTIMIZATION=true
```

### Step 2: Verify Environment Configuration

Create a simple verification script:

```javascript
// verify-config.js
const requiredEnvVars = [
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'DATABASE_URL',
  'DATABASE_ANON_KEY'
];

const optionalEnvVars = [
  'PROOFREADER_AI_MODEL',
  'PROOFREADER_CACHE_TTL',
  'PROOFREADER_MAX_CONTENT_LENGTH'
];

console.log('Checking required environment variables...');
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✓ ${varName}: Set`);
  } else {
    console.error(`✗ ${varName}: Missing`);
  }
});

console.log('\nChecking optional environment variables...');
optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✓ ${varName}: ${process.env[varName]}`);
  } else {
    console.log(`- ${varName}: Using default`);
  }
});
```

Run the verification:

```bash
node verify-config.js
```

## Application Deployment

### Step 1: Build and Test

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm run test

# Run proofreader-specific tests
npm run test -- --grep "proofreader"

# Build the application
npm run build
```

### Step 2: Deploy to Staging

```bash
# Deploy to staging environment
npm run deploy:staging

# Or using your deployment platform (e.g., Vercel, Netlify)
vercel deploy --env-file .env.staging
```

### Step 3: Staging Verification

Run the integration test suite on staging:

```bash
# Set staging environment
export NODE_ENV=staging
export DATABASE_URL=your-staging-db-url

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

### Step 4: Production Deployment

```bash
# Deploy to production
npm run deploy:production

# Or using your deployment platform
vercel deploy --prod --env-file .env.production
```

## Post-Deployment Verification

### Step 1: Health Check

Create a health check endpoint to verify proofreader functionality:

```typescript
// Add to your API routes
app.get('/api/health/proofreader', async (c) => {
  try {
    // Test database connection
    const dbTest = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM proofreading_concerns LIMIT 1'
    ).first();

    // Test AI service (optional - may incur costs)
    // const aiTest = await testAIConnection();

    return c.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});
```

Test the health check:

```bash
curl https://your-domain.com/api/health/proofreader
```

### Step 2: Functional Testing

Test the complete workflow:

1. **Access the Application**
   ```bash
   curl -I https://your-domain.com
   ```

2. **Test Proofreader API Endpoints**
   ```bash
   # Test concerns retrieval (replace with actual conversation ID)
   curl "https://your-domain.com/api/proofreader/concerns/test-conversation-id"
   
   # Test analysis endpoint (requires authentication)
   curl -X POST "https://your-domain.com/api/proofreader/analyze" \
     -H "Content-Type: application/json" \
     -d '{"conversationId":"test-id","documentContent":"test content","ideaDefinitions":[]}'
   ```

3. **Test UI Integration**
   - Open the application in a browser
   - Navigate to any conversation
   - Open the Tools panel
   - Click on the Proofreader tool
   - Verify the interface loads correctly

### Step 3: Performance Monitoring

Set up monitoring for key metrics:

```javascript
// Example monitoring setup (adjust for your monitoring solution)
const monitoringMetrics = {
  'proofreader.analysis.duration': 'histogram',
  'proofreader.analysis.success_rate': 'counter',
  'proofreader.concerns.created': 'counter',
  'proofreader.status.updates': 'counter',
  'proofreader.errors.rate': 'counter'
};

// Add to your application
function trackProofreaderMetric(metric, value, tags = {}) {
  // Implementation depends on your monitoring solution
  // Examples: DataDog, New Relic, Prometheus, etc.
}
```

## Rollback Procedures

### Database Rollback

If you need to rollback the database changes:

```sql
-- Rollback script (use with caution)
DROP TRIGGER IF EXISTS update_proofreading_concerns_updated_at ON proofreading_concerns;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP INDEX IF EXISTS idx_proofreading_sessions_created_at;
DROP INDEX IF EXISTS idx_proofreading_sessions_content_hash;
DROP INDEX IF EXISTS idx_proofreading_sessions_conversation_id;
DROP INDEX IF EXISTS idx_proofreading_concerns_created_at;
DROP INDEX IF EXISTS idx_proofreading_concerns_severity;
DROP INDEX IF EXISTS idx_proofreading_concerns_category;
DROP INDEX IF EXISTS idx_proofreading_concerns_status;
DROP INDEX IF EXISTS idx_proofreading_concerns_conversation_id;

DROP TABLE IF EXISTS proofreading_sessions;
DROP TABLE IF EXISTS proofreading_concerns;

DROP TYPE IF EXISTS concern_status;
DROP TYPE IF EXISTS concern_severity;
DROP TYPE IF EXISTS concern_category;
```

### Application Rollback

```bash
# Rollback to previous version
git revert HEAD
npm run build
npm run deploy:production

# Or using deployment platform
vercel rollback
```

## Monitoring and Maintenance

### Key Metrics to Monitor

1. **Performance Metrics**
   - Analysis completion time
   - API response times
   - Database query performance
   - Cache hit rates

2. **Usage Metrics**
   - Number of analyses performed
   - Concerns generated per analysis
   - Status update frequency
   - User engagement with concerns

3. **Error Metrics**
   - Analysis failure rate
   - API error rates
   - Database connection issues
   - AI service timeouts

### Regular Maintenance Tasks

1. **Weekly**
   - Review error logs
   - Check performance metrics
   - Verify AI service usage and costs

2. **Monthly**
   - Analyze usage patterns
   - Review and optimize database queries
   - Update AI model if newer versions available

3. **Quarterly**
   - Review and update documentation
   - Assess feature usage and user feedback
   - Plan performance optimizations

## Troubleshooting Common Issues

### Database Issues

**Problem**: Migration fails with permission errors
```bash
# Solution: Ensure user has proper permissions
GRANT CREATE ON DATABASE your_database TO your_user;
GRANT USAGE ON SCHEMA public TO your_user;
GRANT CREATE ON SCHEMA public TO your_user;
```

**Problem**: Foreign key constraint errors
```bash
# Solution: Verify parent tables exist
SELECT table_name FROM information_schema.tables WHERE table_name = 'chats';
```

### API Issues

**Problem**: AI service authentication errors
```bash
# Solution: Verify API key is correct and has proper permissions
curl -H "Authorization: Bearer $GOOGLE_GENERATIVE_AI_API_KEY" \
  "https://generativelanguage.googleapis.com/v1/models"
```

**Problem**: High latency in analysis
```bash
# Solution: Check AI service status and consider caching
# Monitor response times and implement timeout handling
```

### Frontend Issues

**Problem**: Proofreader tool not appearing in Tools panel
```bash
# Solution: Verify component imports and registration
# Check browser console for JavaScript errors
# Ensure proper build and deployment
```

## Security Considerations

### Data Protection

1. **Content Encryption**: Ensure thesis content is encrypted in transit
2. **API Rate Limiting**: Implement rate limiting for analysis endpoints
3. **Access Control**: Verify users can only access their own concerns
4. **Audit Logging**: Log all proofreader operations for security monitoring

### AI Service Security

1. **API Key Management**: Store API keys securely (environment variables, secrets management)
2. **Content Filtering**: Sanitize content before sending to AI service
3. **Response Validation**: Validate AI service responses before processing

## Support and Documentation

### User Support

- **User Guide**: Provide link to user documentation
- **Video Tutorials**: Consider creating walkthrough videos
- **FAQ Section**: Document common user questions
- **Support Contact**: Provide clear support contact information

### Developer Support

- **API Documentation**: Maintain up-to-date API documentation
- **Code Comments**: Ensure code is well-documented
- **Architecture Diagrams**: Keep system diagrams current
- **Troubleshooting Guides**: Document common technical issues

## Conclusion

The Proofreader Tool deployment involves database migrations, environment configuration, and careful testing. Follow this guide step-by-step and verify each stage before proceeding to the next.

For additional support or questions about the deployment process, consult the developer documentation or contact the development team.

---

**Deployment Checklist:**

- [ ] Database backup created
- [ ] Migration scripts applied successfully
- [ ] Environment variables configured
- [ ] Application built and tested
- [ ] Staging deployment verified
- [ ] Production deployment completed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team notified of deployment

*Last updated: [Current Date]*
*Version: 1.0*