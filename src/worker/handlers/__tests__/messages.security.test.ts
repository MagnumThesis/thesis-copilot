import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMessagesHandler } from '../messages';

// Mock dependencies
const mockSingle = vi.fn();
const mockOrder = vi.fn(() => ({
    ascending: true
}));
const mockEq = vi.fn(() => ({
    single: mockSingle,
    order: mockOrder
}));
const mockSelect = vi.fn((cols) => {
    return {
        eq: mockEq,
        order: mockOrder
    };
});
const mockFrom = vi.fn((table) => {
    if (table === 'chats') return { select: mockSelect };
    if (table === 'messages') return { select: mockSelect };
    return {};
});

vi.mock('../../lib/supabase', () => ({
    getSupabase: vi.fn(() => ({
        from: mockFrom
    }))
}));

vi.mock('../../lib/auth-utils', () => ({
    getUserIdFromToken: vi.fn((token) => {
        if (token === 'valid-token') return 'user123';
        return null;
    })
}));

describe('getMessagesHandler Security', () => {
    let mockContext: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockContext = {
            req: {
                param: vi.fn(() => 'chat123'),
                header: vi.fn(),
                json: vi.fn()
            },
            env: {
                SUPABASE_JWT_SECRET: 'test-secret'
            },
            json: vi.fn((data, status) => ({ data, status }))
        };
    });

    it('should return 401 if authentication header is missing', async () => {
        mockContext.req.header.mockReturnValue(undefined);

        const response: any = await getMessagesHandler(mockContext as any);

        expect(response.status).toBe(401);
        expect(response.data).toEqual({ error: 'Authentication required' });
    });

    it('should return 401 if authentication token is invalid', async () => {
        mockContext.req.header.mockReturnValue('Bearer invalid-token');

        const response: any = await getMessagesHandler(mockContext as any);

        expect(response.status).toBe(401);
        expect(response.data).toEqual({ error: 'Invalid token' });
    });

    it('should return 404 if chat is not found', async () => {
        mockContext.req.header.mockReturnValue('Bearer valid-token');
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

        const response: any = await getMessagesHandler(mockContext as any);

        expect(response.status).toBe(404);
        expect(response.data).toEqual({ error: 'Chat not found' });
    });

    it('should return 403 if chat belongs to another user', async () => {
        mockContext.req.header.mockReturnValue('Bearer valid-token');
        mockSingle.mockResolvedValueOnce({ data: { user_id: 'user456' }, error: null });

        const response: any = await getMessagesHandler(mockContext as any);

        expect(response.status).toBe(403);
        expect(response.data).toEqual({ error: 'Unauthorized access to chat' });
    });

    it('should return 200 and messages if authenticated and chat owner', async () => {
        mockContext.req.header.mockReturnValue('Bearer valid-token');
        // Mock chat verification success
        mockSingle.mockResolvedValueOnce({ data: { user_id: 'user123' }, error: null });

        // Mock messages retrieval success
        const mockMessagesData = [
            { message_id: 'msg1', role: 'user', content: 'hello' }
        ];
        mockOrder.mockResolvedValueOnce({ data: mockMessagesData, error: null });

        // Temporarily redefine mockOrder so it returns the promise for the messages call
        // We override the base mock for this test
        const originalMockOrder = mockOrder.getMockImplementation();
        mockOrder.mockImplementationOnce(() => Promise.resolve({ data: mockMessagesData, error: null }));

        const response: any = await getMessagesHandler(mockContext as any);

        expect(mockContext.json).toHaveBeenCalled();
        expect(response.data).toEqual([
             { id: 'msg1', role: 'user', content: 'hello' }
        ]);
        expect(response.status).toBeUndefined(); // Assuming default is 200

        // Restore original implementation if needed
        if(originalMockOrder) mockOrder.mockImplementation(originalMockOrder);
    });
});
