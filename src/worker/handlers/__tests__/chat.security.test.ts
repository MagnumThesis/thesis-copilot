import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatHandler } from '../chat';
import { Context } from 'hono';

// Mock dependencies
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({
    single: mockSingle
}));
const mockSelect = vi.fn(() => ({
    eq: mockEq
}));
const mockInsert = vi.fn(() => Promise.resolve({ error: null }));
const mockFrom = vi.fn((table) => {
    if (table === 'chats') return { select: mockSelect };
    if (table === 'messages') return { insert: mockInsert };
    return {};
});

vi.mock('../lib/supabase', () => ({
    getSupabase: vi.fn(() => ({
        from: mockFrom
    }))
}));

vi.mock('../lib/api-keys', () => ({
    getGoogleGenerativeAIKey: vi.fn(() => 'test-api-key')
}));

vi.mock('@ai-sdk/google', () => ({
    createGoogleGenerativeAI: vi.fn(() => vi.fn())
}));

vi.mock('../lib/auth-utils', () => ({
    getUserIdFromToken: vi.fn(async (token) => {
        if (token === 'valid-token') return 'user123';
        if (token === 'other-user-token') return 'user456';
        return null;
    })
}));

vi.mock('ai', () => ({
    streamText: vi.fn(() => ({
        toUIMessageStreamResponse: vi.fn(() => new Response('stream content'))
    })),
    convertToModelMessages: vi.fn((m) => m)
}));

describe('chatHandler Security', () => {
    let mockContext: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockContext = {
            req: {
                json: vi.fn().mockResolvedValue({
                    messages: [{ role: 'user', content: 'Hello', id: '1' }],
                    chatId: 'chat123'
                }),
                header: vi.fn()
            },
            env: {},
            json: vi.fn((data, status) => ({ data, status })),
            get: vi.fn(),
            set: vi.fn()
        };
    });

    it('should return 401 if authentication context is missing', async () => {
        mockContext.get.mockReturnValue(null);

        const response = await chatHandler(mockContext as any);

        expect(response.status).toBe(401);
        expect(response.data).toEqual({ error: 'Authentication required' });
    });

    it('should return 401 if token is invalid', async () => {
        mockContext.get.mockReturnValue({ token: 'invalid-token' });

        const response = await chatHandler(mockContext as any);

        expect(response.status).toBe(401);
        expect(response.data).toEqual({ error: 'Invalid authentication token' });
    });

    it('should return 403 if chat belongs to another user', async () => {
        mockContext.get.mockReturnValue({ token: 'valid-token' }); // userId: user123
        mockSingle.mockResolvedValue({ data: { user_id: 'user456' }, error: null });

        const response = await chatHandler(mockContext as any);

        expect(response.status).toBe(403);
        expect(response.data).toEqual({ error: 'Unauthorized access to chat' });
    });

    it('should return 404 if chat is not found', async () => {
        mockContext.get.mockReturnValue({ token: 'valid-token' });
        mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });

        const response = await chatHandler(mockContext as any);

        expect(response.status).toBe(404);
        expect(response.data).toEqual({ error: 'Chat not found' });
    });

    it('should proceed if authenticated and chat owner', async () => {
        mockContext.get.mockReturnValue({ token: 'valid-token' });
        mockSingle.mockResolvedValue({ data: { user_id: 'user123' }, error: null });

        const response = await chatHandler(mockContext as any);

        expect(response instanceof Response).toBe(true);
    });

    it('should proceed if authenticated and no chatId provided', async () => {
        mockContext.req.json.mockResolvedValue({
            messages: [{ role: 'user', content: 'Hello', id: '1' }]
        });
        mockContext.get.mockReturnValue({ token: 'valid-token' });

        const response = await chatHandler(mockContext as any);

        expect(response instanceof Response).toBe(true);
    });
});
