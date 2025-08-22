import { Hono } from 'hono';
import { cors } from 'hono/cors';
import aiSearcherApi from './handlers/ai-searcher-api';
import { getChatsHandler, createChatHandler, deleteChatHandler, updateChatHandler } from './handlers/chats';
import { getMessagesHandler } from './handlers/messages';
import { generateTitleHandler } from './handlers/generate-title';
import ideasApi from './handlers/ideas';

const app = new Hono();

// Always-on logging middleware for debugging
app.use('*', async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const query = c.req.query();

    // Log incoming request
    console.log(`[${new Date().toISOString()}] → ${method} ${path}`);
    console.log(`   Query:`, query);

    // Log request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await c.req.text();
        if (body) {
          console.log(`   Body:`, body.length > 1000 ? body.substring(0, 1000) + '...' : body);
        }
      } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        console.log(`   Body: <unable to read>`);
      }
    }

    await next();

    const end = Date.now();
    const duration = end - start;
    const status = c.res.status;

    // Log response
    console.log(`[${new Date().toISOString()}] ← ${method} ${path} ${status} (${duration}ms)`);

    if (c.res.headers.get('content-type')?.includes('application/json')) {
      try {
        const responseBody = await c.res.clone().text();
        console.log(`   Response:`, responseBody.length > 1000 ? responseBody.substring(0, 1000) + '...' : responseBody);
      } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        console.log(`   Response: <unable to read>`);
      }
    }
  });

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
    service: 'Thesis Copilot API'
  });
});

// API routes
app.route('/api/ai-searcher', aiSearcherApi);
app.route('/api/ideas', ideasApi);

// Chat API routes
app.get('/api/chats', getChatsHandler);
app.post('/api/chats', createChatHandler);
app.delete('/api/chats/:id', deleteChatHandler);
app.patch('/api/chats/:id', updateChatHandler);
app.get('/api/chats/:id/messages', getMessagesHandler);
app.post('/api/generate-title', generateTitleHandler);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Thesis Copilot API',
    version: '1.0.0',
    endpoints: {
      // Chat endpoints
      chats: {
        getChats: 'GET /api/chats',
        createChat: 'POST /api/chats',
        deleteChat: 'DELETE /api/chats/:id',
        updateChat: 'PATCH /api/chats/:id',
        getMessages: 'GET /api/chats/:id/messages',
        generateTitle: 'POST /api/generate-title'
      },
      // AI Searcher endpoints
      aiSearcher: {
        search: 'POST /api/ai-searcher/search',
        extract: 'POST /api/ai-searcher/extract',
        history: 'GET /api/ai-searcher/history',
        analytics: 'GET /api/ai-searcher/analytics',
        trending: 'GET /api/ai-searcher/trending',
        statistics: 'GET /api/ai-searcher/statistics',
        health: 'GET /api/ai-searcher/health'
      },
      // Ideas endpoints
      ideas: {
        getIdeas: 'GET /api/ideas',
        createIdea: 'POST /api/ideas',
        getIdea: 'GET /api/ideas/:id',
        updateIdea: 'PATCH /api/ideas/:id',
        deleteIdea: 'DELETE /api/ideas/:id'
      },
      // General endpoints
      general: {
        root: 'GET /',
        health: 'GET /health'
      }
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
    availableEndpoints: {
      chatEndpoints: [
        'GET /api/chats',
        'POST /api/chats',
        'DELETE /api/chats/:id',
        'PATCH /api/chats/:id',
        'GET /api/chats/:id/messages',
        'POST /api/generate-title'
      ],
      aiSearcherEndpoints: [
        'POST /api/ai-searcher/search',
        'POST /api/ai-searcher/extract',
        'GET /api/ai-searcher/history',
        'GET /api/ai-searcher/analytics',
        'GET /api/ai-searcher/trending',
        'GET /api/ai-searcher/statistics',
        'DELETE /api/ai-searcher/history',
        'GET /api/ai-searcher/health'
      ],
      ideasEndpoints: [
        'GET /api/ideas',
        'POST /api/ideas',
        'GET /api/ideas/:id',
        'PATCH /api/ideas/:id',
        'DELETE /api/ideas/:id'
      ],
      generalEndpoints: [
        'GET /',
        'GET /health'
      ]
    }
  }, 404);
});

export default app;
