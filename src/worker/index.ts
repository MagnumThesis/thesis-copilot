import { Hono } from 'hono';
import { cors } from 'hono/cors';
import referencerApi from './handlers/referencer-api';
import aiSearcherApi from './handlers/ai-searcher-api';
import searchResultManagementApi from './handlers/search-result-management';
import { getChatsHandler, createChatHandler, deleteChatHandler, updateChatHandler } from './handlers/chats';
import { getMessagesHandler } from './handlers/messages';
import { generateTitleHandler } from './handlers/generate-title';
import ideasApi from './handlers/ideas';
import builderContentApi from './handlers/builder-content';
import { builderAIPromptHandler, builderAIContinueHandler, builderAIModifyHandler } from './handlers/builder-ai';
import { proofreaderAnalysisHandler, getConcernsHandler, updateConcernStatusHandler, getConcernStatisticsHandler } from './handlers/proofreader-ai';

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

// API health check endpoint (for frontend compatibility)
app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Thesis Copilot API'
  });
});

// Builder API routes
const builderApi = new Hono();
builderApi.post('/ai/prompt', builderAIPromptHandler);
builderApi.post('/ai/continue', builderAIContinueHandler);
builderApi.post('/ai/modify', builderAIModifyHandler);

// API routes
app.route('/api/referencer', referencerApi);
app.route('/api/ai-searcher', aiSearcherApi);
app.route('/api/search-result-management', searchResultManagementApi);
app.route('/api/ideas', ideasApi);
app.route('/api/builder', builderApi);
app.route('/api/builder-content', builderContentApi);

// Chat API routes
app.get('/api/chats', getChatsHandler);
app.post('/api/chats', createChatHandler);
app.delete('/api/chats/:id', deleteChatHandler);
app.patch('/api/chats/:id', updateChatHandler);
app.get('/api/chats/:id/messages', getMessagesHandler);
app.post('/api/generate-title', generateTitleHandler);

// Proofreader API routes
app.post('/api/proofreader/analyze', proofreaderAnalysisHandler);
app.get('/api/proofreader/concerns/:conversationId', getConcernsHandler);
app.put('/api/proofreader/concerns/:concernId/status', updateConcernStatusHandler);
app.get('/api/proofreader/concerns/:conversationId/statistics', getConcernStatisticsHandler);

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
      // Search Result Management endpoints
      searchResultManagement: {
        bookmarks: {
          create: 'POST /api/search-result-management/bookmarks',
          remove: 'DELETE /api/search-result-management/bookmarks',
          list: 'GET /api/search-result-management/bookmarks/:userId',
          check: 'POST /api/search-result-management/bookmarks/check'
        },
        comparison: {
          add: 'POST /api/search-result-management/comparison',
          remove: 'DELETE /api/search-result-management/comparison',
          list: 'GET /api/search-result-management/comparison/:userId',
          clear: 'DELETE /api/search-result-management/comparison/:userId'
        },
        export: 'POST /api/search-result-management/export',
        sharing: {
          create: 'POST /api/search-result-management/share',
          get: 'GET /api/search-result-management/share/:shareId'
        },
        health: 'GET /api/search-result-management/health'
      },
      // Ideas endpoints
      ideas: {
        getIdeas: 'GET /api/ideas',
        createIdea: 'POST /api/ideas',
        getIdea: 'GET /api/ideas/:id',
        updateIdea: 'PATCH /api/ideas/:id',
        deleteIdea: 'DELETE /api/ideas/:id'
      },
      // Builder endpoints
      builder: {
        prompt: 'POST /api/builder/ai/prompt',
        continue: 'POST /api/builder/ai/continue',
        modify: 'POST /api/builder/ai/modify'
      },
      // Builder Content endpoints
      builderContent: {
        save: 'POST /api/builder-content',
        get: 'GET /api/builder-content/:conversationId',
        delete: 'DELETE /api/builder-content/:conversationId'
      },
      // Proofreader endpoints
      proofreader: {
        analyze: 'POST /api/proofreader/analyze',
        getConcerns: 'GET /api/proofreader/concerns/:conversationId',
        updateStatus: 'PUT /api/proofreader/concerns/:concernId/status',
        getStatistics: 'GET /api/proofreader/concerns/:conversationId/statistics'
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
      builderEndpoints: [
        'POST /api/builder/ai/prompt',
        'POST /api/builder/ai/continue',
        'POST /api/builder/ai/modify'
      ],
      proofreaderEndpoints: [
        'POST /api/proofreader/analyze',
        'GET /api/proofreader/concerns/:conversationId',
        'PUT /api/proofreader/concerns/:concernId/status',
        'GET /api/proofreader/concerns/:conversationId/statistics'
      ],
      generalEndpoints: [
        'GET /',
        'GET /health',
        'GET /api/health'
      ]
    }
  }, 404);
});

export default app;
