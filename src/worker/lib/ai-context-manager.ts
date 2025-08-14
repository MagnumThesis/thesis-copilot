/**
 * AI Context Manager
 * Manages document context, idea definitions, and conversation context for AI processing
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentContext, DocumentSection, IdeaDefinition } from '../../lib/ai-types';

export interface AIContextManager {
  buildContext(documentContent: string, conversationId: string, cursorPosition?: number, selectedText?: string): Promise<DocumentContext>;
  getIdeaDefinitions(conversationId: string): Promise<IdeaDefinition[]>;
  formatContextForAI(context: DocumentContext): string;
  getConversationContext(conversationId: string): Promise<{ title: string; messages: Array<{ role: string; content: string }> }>;
}

export class AIContextManagerImpl implements AIContextManager {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Build comprehensive context for AI processing
   */
  async buildContext(
    documentContent: string, 
    conversationId: string, 
    cursorPosition: number = 0, 
    selectedText?: string
  ): Promise<DocumentContext> {
    try {
      // Get idea definitions and conversation context in parallel
      const [ideaDefinitions, conversationContext] = await Promise.all([
        this.getIdeaDefinitions(conversationId),
        this.getConversationContext(conversationId)
      ]);

      // Analyze document structure
      const documentStructure = this.analyzeDocumentStructure(documentContent);

      return {
        content: documentContent,
        ideaDefinitions,
        conversationTitle: conversationContext.title,
        cursorPosition,
        selectedText,
        documentStructure
      };
    } catch (error) {
      console.error('Error building AI context:', error);
      // Return minimal context on error
      return {
        content: documentContent,
        ideaDefinitions: [],
        conversationTitle: 'Unknown',
        cursorPosition,
        selectedText,
        documentStructure: []
      };
    }
  }

  /**
   * Retrieve idea definitions for a conversation
   */
  async getIdeaDefinitions(conversationId: string): Promise<IdeaDefinition[]> {
    try {
      const { data, error } = await this.supabase
        .from('ideas')
        .select('id, title, description, conversationid')
        .eq('conversationid', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching idea definitions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getIdeaDefinitions:', error);
      return [];
    }
  }

  /**
   * Get conversation context including title and recent messages
   */
  async getConversationContext(conversationId: string): Promise<{ title: string; messages: Array<{ role: string; content: string }> }> {
    try {
      // Get conversation title and recent messages in parallel
      const [chatResult, messagesResult] = await Promise.all([
        this.supabase
          .from('chats')
          .select('name')
          .eq('id', conversationId)
          .single(),
        this.supabase
          .from('messages')
          .select('role, content')
          .eq('chat_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(10) // Get last 10 messages for context
      ]);

      const title = chatResult.data?.name || 'Unknown Conversation';
      const messages = messagesResult.data || [];

      // Reverse messages to get chronological order
      return {
        title,
        messages: messages.reverse()
      };
    } catch (error) {
      console.error('Error fetching conversation context:', error);
      return {
        title: 'Unknown Conversation',
        messages: []
      };
    }
  }

  /**
   * Format context for AI prompts
   */
  formatContextForAI(context: DocumentContext): string {
    const sections: string[] = [];

    // Add conversation context
    sections.push(`## Conversation Context`);
    sections.push(`**Title:** ${context.conversationTitle}`);
    
    // Add idea definitions if available
    if (context.ideaDefinitions.length > 0) {
      sections.push(`\n## Defined Ideas`);
      context.ideaDefinitions.forEach(idea => {
        sections.push(`**${idea.title}:** ${idea.description}`);
      });
    }

    // Add document structure overview
    if (context.documentStructure.length > 0) {
      sections.push(`\n## Document Structure`);
      const headings = context.documentStructure
        .filter(section => section.type === 'heading')
        .map(section => `${'#'.repeat(section.level || 1)} ${section.content}`)
        .join('\n');
      if (headings) {
        sections.push(headings);
      }
    }

    // Add current document content
    sections.push(`\n## Current Document Content`);
    sections.push(context.content);

    // Add cursor position context if available
    if (context.cursorPosition > 0) {
      const beforeCursor = context.content.substring(0, context.cursorPosition);
      const afterCursor = context.content.substring(context.cursorPosition);
      sections.push(`\n## Cursor Position Context`);
      sections.push(`**Content before cursor:** ${beforeCursor.slice(-200)}`); // Last 200 chars
      sections.push(`**Content after cursor:** ${afterCursor.slice(0, 200)}`); // Next 200 chars
    }

    // Add selected text if available
    if (context.selectedText) {
      sections.push(`\n## Selected Text`);
      sections.push(`"${context.selectedText}"`);
    }

    return sections.join('\n');
  }

  /**
   * Analyze document structure to identify sections, headings, etc.
   */
  private analyzeDocumentStructure(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentPosition = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = currentPosition;
      const lineEnd = currentPosition + line.length;

      // Detect headings
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        sections.push({
          type: 'heading',
          level: headingMatch[1].length,
          content: headingMatch[2].trim(),
          position: { start: lineStart, end: lineEnd }
        });
      }
      // Detect lists
      else if (line.match(/^\s*[-*+]\s+/) || line.match(/^\s*\d+\.\s+/)) {
        sections.push({
          type: 'list',
          content: line.trim(),
          position: { start: lineStart, end: lineEnd }
        });
      }
      // Detect code blocks
      else if (line.match(/^```/)) {
        sections.push({
          type: 'code',
          content: line.trim(),
          position: { start: lineStart, end: lineEnd }
        });
      }
      // Regular paragraphs
      else if (line.trim().length > 0) {
        sections.push({
          type: 'paragraph',
          content: line.trim(),
          position: { start: lineStart, end: lineEnd }
        });
      }

      currentPosition = lineEnd + 1; // +1 for newline character
    }

    return sections;
  }
}

/**
 * Factory function to create AI context manager instance
 */
export function createAIContextManager(supabase: SupabaseClient): AIContextManager {
  return new AIContextManagerImpl(supabase);
}