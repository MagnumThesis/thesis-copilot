import { Hono } from 'hono';
import { cors } from 'hono/cors';
import aiSearcherApi from './handlers/referencer-api';

const app = new Hono();

// CORS middleware
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AI Searcher API'
  });
});

// API routes
app.route('/api/ai-searcher', aiSearcherApi);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'AI Searcher API',
    version: '1.0.0',
    endpoints: {
      search: 'POST /api/ai-searcher/search',
      extract: 'POST /api/ai-searcher/extract',
      history: 'GET /api/ai-searcher/history',
      analytics: 'GET /api/ai-searcher/analytics',
      trending: 'GET /api/ai-searcher/trending',
      statistics: 'GET /api/ai-searcher/statistics',
      health: 'GET /api/ai-searcher/health'
    }
  });
});

// Error handling middleware
app.onError((err, c) => {
  console.error('API Error:', err);

  return c.json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/ai-searcher/search',
      'POST /api/ai-searcher/extract',
      'GET /api/ai-searcher/history',
      'GET /api/ai-searcher/analytics',
      'GET /api/ai-searcher/trending',
      'GET /api/ai-searcher/statistics',
      'DELETE /api/ai-searcher/history',
      'GET /api/ai-searcher/health'
    ]
  }, 404);
});

export default app;
