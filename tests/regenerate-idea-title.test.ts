import { describe, it, expect, vi, beforeEach } from 'vitest';
import { regenerateIdeaTitleHandler } from '../src/worker/handlers/regenerate-idea-title';
import { Context } from 'hono';

// Mock dependencies
vi.mock('../src/worker/lib/supabase', () => ({
  getSupabase: vi.fn(),
}));

vi.mock('../src/worker/lib/api-keys', () => ({
  getGoogleGenerativeAIKey: vi.fn(),
}));

vi.mock('../src/worker/lib/auth-utils', () => ({
  getUserIdFromToken: vi.fn(),
}));

vi.mock('../src/worker/lib/model-fallback', () => ({
  withModelFallback: vi.fn(),
}));

import { getSupabase } from '../src/worker/lib/supabase';
import { getGoogleGenerativeAIKey } from '../src/worker/lib/api-keys';
import { getUserIdFromToken } from '../src/worker/lib/auth-utils';
import { withModelFallback } from '../src/worker/lib/model-fallback';

describe('regenerateIdeaTitleHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContext = (body: any, headers: Record<string, string> = {}) => {
    const jsonMock = vi.fn().mockResolvedValue(body);
    const headerMock = vi.fn((key: string) => headers[key]);
    const jsonResMock = vi.fn((data: any, status?: number) => ({ data, status }));

    return {
      req: {
        json: jsonMock,
        header: headerMock,
      },
      json: jsonResMock,
      env: {},
    } as unknown as Context;
  };

  it('should return 401 if authentication token is missing', async () => {
    const c = createMockContext({ ideaId: 1, description: 'Test idea' });

    const response = await regenerateIdeaTitleHandler(c as any);

    expect(c.json).toHaveBeenCalledWith({ error: "Authentication required" }, 401);
  });

  it('should return 401 if user id cannot be extracted from token', async () => {
    const c = createMockContext(
      { ideaId: 1, description: 'Test idea' },
      { 'Authorization': 'Bearer invalid-token' }
    );
    vi.mocked(getUserIdFromToken).mockResolvedValue(null);

    const response = await regenerateIdeaTitleHandler(c as any);

    expect(c.json).toHaveBeenCalledWith({ error: "Invalid token" }, 401);
  });

  it('should return 404 if idea is not found', async () => {
    const c = createMockContext(
      { ideaId: 1, description: 'Test idea' },
      { 'Authorization': 'Bearer valid-token' }
    );
    vi.mocked(getUserIdFromToken).mockResolvedValue('user-123');
    vi.mocked(getGoogleGenerativeAIKey).mockReturnValue('fake-api-key');

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const response = await regenerateIdeaTitleHandler(c as any);

    expect(c.json).toHaveBeenCalledWith({ error: "Idea not found." }, 404);
  });

  it('should return 403 if the idea does not have a conversationid', async () => {
    const c = createMockContext(
      { ideaId: 1, description: 'Test idea' },
      { 'Authorization': 'Bearer valid-token' }
    );
    vi.mocked(getUserIdFromToken).mockResolvedValue('user-123');
    vi.mocked(getGoogleGenerativeAIKey).mockReturnValue('fake-api-key');

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'ideas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { conversationid: null }, error: null }),
          };
        }
        return {};
      }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const response = await regenerateIdeaTitleHandler(c as any);

    expect(c.json).toHaveBeenCalledWith({ error: "Forbidden: Cannot verify ownership of this idea." }, 403);
  });

  it('should return 403 if user does not own the chat associated with the idea', async () => {
    const c = createMockContext(
      { ideaId: 1, description: 'Test idea' },
      { 'Authorization': 'Bearer valid-token' }
    );
    vi.mocked(getUserIdFromToken).mockResolvedValue('user-123');
    vi.mocked(getGoogleGenerativeAIKey).mockReturnValue('fake-api-key');

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'ideas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { conversationid: 'chat-456' }, error: null }),
          };
        }
        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { user_id: 'other-user-789' }, error: null }),
          };
        }
        return {};
      }),
    };
    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const response = await regenerateIdeaTitleHandler(c as any);

    expect(c.json).toHaveBeenCalledWith({ error: "Forbidden: You do not have permission to modify this idea." }, 403);
  });

  it('should proceed and generate a title if user owns the chat associated with the idea', async () => {
    const c = createMockContext(
      { ideaId: 1, description: 'Test idea' },
      { 'Authorization': 'Bearer valid-token' }
    );
    vi.mocked(getUserIdFromToken).mockResolvedValue('user-123');
    vi.mocked(getGoogleGenerativeAIKey).mockReturnValue('fake-api-key');
    vi.mocked(withModelFallback).mockResolvedValue({ object: { title: 'New Generated Title' } });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'ideas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { conversationid: 'chat-456' }, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
          };
        }
        return {};
      }),
    };

    // Specifically override update -> eq -> select -> single for ideas
    const updateChain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 1, title: 'New Generated Title' }, error: null }),
    };
    mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ideas') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { conversationid: 'chat-456' }, error: null }),
            update: vi.fn().mockReturnValue(updateChain),
          };
        }
        if (table === 'chats') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123' }, error: null }),
          };
        }
        return {};
    });

    vi.mocked(getSupabase).mockReturnValue(mockSupabase as any);

    const response = await regenerateIdeaTitleHandler(c as any);

    expect(c.json).toHaveBeenCalledWith({
      title: 'New Generated Title',
      saved: true,
      idea: { id: 1, title: 'New Generated Title' }
    });
  });
});
