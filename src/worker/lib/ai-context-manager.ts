/**
 * AI Context Manager
 * Manages document context, idea definitions, and conversation context for AI processing
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DocumentContext, DocumentSection, IdeaDefinition } from '../../lib/ai-types';
import { AcademicContextAnalyzer } from './academic-context-analyzer';

export interface AIContextManager {
  buildContext(documentContent: string, conversationId: string, cursorPosition?: number, selectedText?: string): Promise<DocumentContext>;
  getIdeaDefinitions(conversationId: string): Promise<IdeaDefinition[]>;
  formatContextForAI(context: DocumentContext): string;
  getConversationContext(conversationId: string): Promise<{ title: string; messages: Array<{ role: string; content: string }> }>;
  getAcademicWritingGuidelines(context: DocumentContext): string;
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
      
      // Analyze academic context
      const academicContext = AcademicContextAnalyzer.analyzeAcademicContext(
        documentContent, 
        conversationContext.title
      );

      return {
        content: documentContent,
        ideaDefinitions,
        conversationTitle: conversationContext.title,
        cursorPosition,
        selectedText,
        documentStructure,
        academicContext
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
        documentStructure: [],
        academicContext: undefined
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
   * Format context for AI prompts with academic context
   */
  formatContextForAI(context: DocumentContext): string {
    const sections: string[] = [];

    // Add conversation context
    sections.push(`## Conversation Context`);
    sections.push(`**Title:** ${context.conversationTitle}`);
    
    // Add academic context if available
    if (context.academicContext) {
      sections.push(`\n## Academic Context`);
      sections.push(`**Academic Level:** ${context.academicContext.academicTone.level}`);
      sections.push(`**Discipline:** ${context.academicContext.academicTone.discipline}`);
      sections.push(`**Formality Score:** ${(context.academicContext.academicTone.formalityScore * 100).toFixed(0)}%`);
      
      if (context.academicContext.researchMethodology) {
        sections.push(`**Research Methodology:** ${context.academicContext.researchMethodology}`);
      }
      
      if (context.academicContext.citationFormat.detected) {
        sections.push(`**Citation Style:** ${context.academicContext.citationFormat.style}`);
        if (context.academicContext.citationFormat.examples.length > 0) {
          sections.push(`**Citation Examples:** ${context.academicContext.citationFormat.examples.join(', ')}`);
        }
      }
      
      if (context.academicContext.keyTerms.length > 0) {
        sections.push(`**Key Terms:** ${context.academicContext.keyTerms.join(', ')}`);
      }
      
      // Add thesis structure information
      const thesisStructure = context.academicContext.thesisStructure;
      sections.push(`**Thesis Completeness:** ${(thesisStructure.completeness * 100).toFixed(0)}%`);
      
      const presentSections = thesisStructure.sections.filter(s => s.present).map(s => s.name);
      const missingSections = thesisStructure.sections.filter(s => s.required && !s.present).map(s => s.name);
      
      if (presentSections.length > 0) {
        sections.push(`**Present Sections:** ${presentSections.join(', ')}`);
      }
      if (missingSections.length > 0) {
        sections.push(`**Missing Required Sections:** ${missingSections.join(', ')}`);
      }
      if (thesisStructure.currentSection) {
        sections.push(`**Current Section:** ${thesisStructure.currentSection}`);
      }
    }
    
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

  /**
   * Get academic writing guidelines based on context
   */
  getAcademicWritingGuidelines(context: DocumentContext): string {
    if (!context.academicContext) {
      return "Follow general academic writing principles: formal tone, clear structure, evidence-based arguments.";
    }

    const guidelines: string[] = [];
    const academic = context.academicContext;

    // Level-specific guidelines
    switch (academic.academicTone.level) {
      case 'doctoral':
        guidelines.push("Use sophisticated academic language and demonstrate original contribution to knowledge");
        guidelines.push("Employ complex theoretical frameworks and advanced methodological approaches");
        break;
      case 'graduate':
        guidelines.push("Use advanced academic vocabulary and demonstrate critical analysis");
        guidelines.push("Show understanding of theoretical concepts and research methodologies");
        break;
      case 'undergraduate':
        guidelines.push("Use clear academic language and demonstrate understanding of key concepts");
        guidelines.push("Show ability to synthesize information from multiple sources");
        break;
    }

    // Citation guidelines
    if (academic.citationFormat.detected) {
      guidelines.push(`Follow ${academic.citationFormat.style} citation format consistently`);
      guidelines.push("Ensure all claims are properly supported with citations");
    } else {
      guidelines.push("Include proper citations to support all claims and arguments");
    }

    // Structure guidelines
    if (academic.thesisStructure.completeness < 0.5) {
      guidelines.push("Focus on developing the core thesis structure with clear sections");
    }

    // Discipline-specific guidelines
    if (academic.academicTone.discipline !== 'general') {
      guidelines.push(`Use terminology and conventions appropriate for ${academic.academicTone.discipline}`);
    }

    // Methodology guidelines
    if (academic.researchMethodology) {
      guidelines.push(`Align content with ${academic.researchMethodology} research approach`);
    }

    return guidelines.join('\n- ');
  }
}

/**
 * Factory function to create AI context manager instance
 */
export function createAIContextManager(supabase: SupabaseClient): AIContextManager {
  return new AIContextManagerImpl(supabase);
}