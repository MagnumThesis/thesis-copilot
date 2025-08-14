/**
 * Unit tests for AI Context Manager
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIContextManagerImpl, createAIContextManager } from '../worker/lib/ai-context-manager';
import { DocumentContext, IdeaDefinition } from '../lib/ai-types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
          data: [],
          error: null
        })),
        single: vi.fn(() => ({ data: null, error: null })),
        data: [],
        error: null
      }))
    }))
  }))
};

describe('AIContextManager', () => {
  let contextManager: AIContextManagerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    contextManager = new AIContextManagerImpl(mockSupabase as any);
  });

  describe('getIdeaDefinitions', () => {
    it('should retrieve idea definitions for a conversation', async () => {
      const mockIdeas: IdeaDefinition[] = [
        { id: 1, title: 'AI Ethics', description: 'Study of ethical implications of AI', conversationid: 'conv-1' },
        { id: 2, title: 'Machine Learning', description: 'Algorithms that learn from data', conversationid: 'conv-1' }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockIdeas,
              error: null
            }))
          }))
        }))
      });

      const result = await contextManager.getIdeaDefinitions('conv-1');

      expect(result).toEqual(mockIdeas);
      expect(mockSupabase.from).toHaveBeenCalledWith('ideas');
    });

    it('should return empty array on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      });

      const result = await contextManager.getIdeaDefinitions('conv-1');

      expect(result).toEqual([]);
    });

    it('should handle exceptions gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection error');
      });

      const result = await contextManager.getIdeaDefinitions('conv-1');

      expect(result).toEqual([]);
    });
  });

  describe('getConversationContext', () => {
    it('should retrieve conversation title and messages', async () => {
      const mockChat = { name: 'AI Research Discussion' };
      const mockMessages = [
        { role: 'user', content: 'What is AI?' },
        { role: 'assistant', content: 'AI is artificial intelligence...' }
      ];

      // Mock parallel calls
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: mockChat,
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: mockMessages.reverse(), // Simulate reverse order from DB
                  error: null
                }))
              }))
            }))
          }))
        });

      const result = await contextManager.getConversationContext('conv-1');

      expect(result.title).toBe('AI Research Discussion');
      expect(result.messages).toEqual(mockMessages.reverse()); // Should be in chronological order
    });

    it('should handle missing conversation gracefully', async () => {
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { message: 'Not found' }
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        });

      const result = await contextManager.getConversationContext('nonexistent');

      expect(result.title).toBe('Unknown Conversation');
      expect(result.messages).toEqual([]);
    });
  });

  describe('buildContext', () => {
    it('should build comprehensive document context', async () => {
      const mockIdeas: IdeaDefinition[] = [
        { id: 1, title: 'AI Ethics', description: 'Study of ethical implications', conversationid: 'conv-1' }
      ];
      const mockConversation = {
        title: 'Research Discussion',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      // Mock the methods
      vi.spyOn(contextManager, 'getIdeaDefinitions').mockResolvedValue(mockIdeas);
      vi.spyOn(contextManager, 'getConversationContext').mockResolvedValue(mockConversation);

      const documentContent = '# Introduction\n\nThis is a test document.\n\n## Background\n\nSome background info.';
      const result = await contextManager.buildContext(documentContent, 'conv-1', 10, 'test');

      expect(result.content).toBe(documentContent);
      expect(result.ideaDefinitions).toEqual(mockIdeas);
      expect(result.conversationTitle).toBe('Research Discussion');
      expect(result.cursorPosition).toBe(10);
      expect(result.selectedText).toBe('test');
      expect(result.documentStructure).toHaveLength(4); // 2 headings + 2 paragraphs
    });

    it('should return minimal context on error', async () => {
      vi.spyOn(contextManager, 'getIdeaDefinitions').mockRejectedValue(new Error('DB error'));
      vi.spyOn(contextManager, 'getConversationContext').mockRejectedValue(new Error('DB error'));

      const documentContent = 'Simple content';
      const result = await contextManager.buildContext(documentContent, 'conv-1');

      expect(result.content).toBe(documentContent);
      expect(result.ideaDefinitions).toEqual([]);
      expect(result.conversationTitle).toBe('Unknown');
      expect(result.documentStructure).toEqual([]);
    });
  });

  describe('formatContextForAI', () => {
    it('should format context properly for AI consumption', () => {
      const context: DocumentContext = {
        content: '# Test Document\n\nThis is content.',
        ideaDefinitions: [
          { id: 1, title: 'AI Ethics', description: 'Ethical AI study', conversationid: 'conv-1' }
        ],
        conversationTitle: 'Research Chat',
        cursorPosition: 15,
        selectedText: 'Test Document',
        documentStructure: [
          { type: 'heading', level: 1, content: 'Test Document', position: { start: 0, end: 15 } },
          { type: 'paragraph', content: 'This is content.', position: { start: 17, end: 33 } }
        ]
      };

      const formatted = contextManager.formatContextForAI(context);

      expect(formatted).toContain('## Conversation Context');
      expect(formatted).toContain('**Title:** Research Chat');
      expect(formatted).toContain('## Defined Ideas');
      expect(formatted).toContain('**AI Ethics:** Ethical AI study');
      expect(formatted).toContain('## Document Structure');
      expect(formatted).toContain('# Test Document');
      expect(formatted).toContain('## Current Document Content');
      expect(formatted).toContain('# Test Document\n\nThis is content.');
      expect(formatted).toContain('## Cursor Position Context');
      expect(formatted).toContain('## Selected Text');
      expect(formatted).toContain('"Test Document"');
    });

    it('should handle minimal context without optional fields', () => {
      const context: DocumentContext = {
        content: 'Simple content',
        ideaDefinitions: [],
        conversationTitle: 'Basic Chat',
        cursorPosition: 0,
        documentStructure: []
      };

      const formatted = contextManager.formatContextForAI(context);

      expect(formatted).toContain('## Conversation Context');
      expect(formatted).toContain('**Title:** Basic Chat');
      expect(formatted).toContain('## Current Document Content');
      expect(formatted).toContain('Simple content');
      expect(formatted).not.toContain('## Defined Ideas');
      expect(formatted).not.toContain('## Document Structure');
      expect(formatted).not.toContain('## Cursor Position Context');
      expect(formatted).not.toContain('## Selected Text');
    });
  });

  describe('analyzeDocumentStructure', () => {
    it('should identify headings correctly', () => {
      const content = '# Main Title\n## Subtitle\n### Sub-subtitle\nRegular text';
      const result = (contextManager as any).analyzeDocumentStructure(content);

      const headings = result.filter((section: any) => section.type === 'heading');
      expect(headings).toHaveLength(3);
      expect(headings[0].level).toBe(1);
      expect(headings[0].content).toBe('Main Title');
      expect(headings[1].level).toBe(2);
      expect(headings[1].content).toBe('Subtitle');
      expect(headings[2].level).toBe(3);
      expect(headings[2].content).toBe('Sub-subtitle');
    });

    it('should identify lists correctly', () => {
      const content = '- Item 1\n* Item 2\n+ Item 3\n1. Numbered item\n2. Another numbered';
      const result = (contextManager as any).analyzeDocumentStructure(content);

      const lists = result.filter((section: any) => section.type === 'list');
      expect(lists).toHaveLength(5);
      expect(lists[0].content).toBe('- Item 1');
      expect(lists[3].content).toBe('1. Numbered item');
    });

    it('should identify code blocks', () => {
      const content = '```javascript\nconst x = 1;\n```\nRegular text\n```python\nprint("hello")\n```';
      const result = (contextManager as any).analyzeDocumentStructure(content);

      const codeBlocks = result.filter((section: any) => section.type === 'code');
      expect(codeBlocks.length).toBeGreaterThanOrEqual(2);
      expect(codeBlocks[0].content).toBe('```javascript');
      expect(codeBlocks.some((block: any) => block.content === '```python')).toBe(true);
    });

    it('should identify paragraphs', () => {
      const content = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
      const result = (contextManager as any).analyzeDocumentStructure(content);

      const paragraphs = result.filter((section: any) => section.type === 'paragraph');
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0].content).toBe('First paragraph');
      expect(paragraphs[1].content).toBe('Second paragraph');
      expect(paragraphs[2].content).toBe('Third paragraph');
    });

    it('should calculate positions correctly', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const result = (contextManager as any).analyzeDocumentStructure(content);

      expect(result[0].position).toEqual({ start: 0, end: 6 }); // "Line 1"
      expect(result[1].position).toEqual({ start: 7, end: 13 }); // "Line 2"
      expect(result[2].position).toEqual({ start: 14, end: 20 }); // "Line 3"
    });
  });

  describe('createAIContextManager factory', () => {
    it('should create AIContextManager instance', () => {
      const manager = createAIContextManager(mockSupabase as any);
      expect(manager).toBeInstanceOf(AIContextManagerImpl);
    });
  });
});