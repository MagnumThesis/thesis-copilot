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

      // Count words and paragraphs
      const wordCount = documentContent.split(/\s+/).filter(word => word.length > 0).length;
      const paragraphCount = documentContent.split('\n\n').length;

      const documentContext: DocumentContext = {
        conversationId,
        documentContent,
        cursorPosition,
        selectedText,
        wordCount,
        paragraphCount,
        ideaDefinitions,
        conversationTitle: conversationContext.title,
        documentStructure,
        academicContext,
        content: documentContent,
        conversationMessages: conversationContext.messages
      };

      return documentContext;
    } catch (error) {
      console.error('Error building AI context:', error);
      // Return minimal context on error
      const wordCount = documentContent.split(/\s+/).filter(word => word.length > 0).length;
      const paragraphCount = documentContent.split('\n\n').length;
      
      return {
        conversationId,
        documentContent: documentContent,
        cursorPosition,
        selectedText,
        wordCount,
        paragraphCount,
        ideaDefinitions: [],
        conversationTitle: 'Unknown',
        documentStructure: [],
        academicContext: undefined,
        content: documentContent
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
        .select('id, title, description, created_at, updated_at, conversationid')
        .eq('conversationid', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching idea definitions:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        content: item.content || '',
        type: item.type || 'text',
        tags: Array.isArray(item.tags) ? item.tags : [],
        confidence: item.confidence || 1,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error in getIdeaDefinitions:', error);
      return [];
    }
  }

  /**
   * Get conversation context including title and recent messages
   */
  async getConversationContext(conversationId: string): Promise<{ title: string; messages: Array<{ role: string; content: string; files?: Array<{ name: string; type: string; content?: string }> }> }> {
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
      const rawMessages = messagesResult.data || [];

      // Parse message content - it may be stored as JSON string from chat parts
      const messages = rawMessages.reverse().map((msg: any) => {
        let parsedContent = msg.content;
        let files: Array<{ name: string; type: string; content?: string }> = [];
        
        // Try to parse if it's a JSON string (from chat parts)
        if (typeof msg.content === 'string') {
          try {
            const parsed = JSON.parse(msg.content);
            // If it's an array of parts, extract text and file content
            if (Array.isArray(parsed)) {
              // Extract text parts
              const textParts = parsed
                .filter((part: any) => part.type === 'text')
                .map((part: any) => part.text);
              parsedContent = textParts.join('');
              
              // Extract file parts
              const fileParts = parsed.filter((part: any) => part.type === 'file');
              files = fileParts.map((part: any) => {
                const file: { name: string; type: string; content?: string } = {
                  name: part.filename || part.name || 'Unknown file',
                  type: part.mediaType || part.mimeType || 'unknown'
                };
                
                // For text-based files, try to extract content from data URL
                if (part.url && (
                  part.mediaType?.startsWith('text/') || 
                  part.mediaType?.includes('json') ||
                  part.mediaType?.includes('xml') ||
                  part.mediaType?.includes('javascript') ||
                  part.mediaType?.includes('markdown')
                )) {
                  try {
                    // Extract base64 content from data URL
                    const base64Match = part.url.match(/^data:[^;]+;base64,(.+)$/);
                    if (base64Match) {
                      // Decode base64 to text
                      const decoded = atob(base64Match[1]);
                      // Limit file content to prevent context overflow
                      file.content = decoded.length > 5000 
                        ? decoded.substring(0, 5000) + '\n...[truncated]'
                        : decoded;
                    }
                  } catch (e) {
                    console.warn('Failed to decode file content:', e);
                  }
                }
                
                return file;
              });
            } else if (typeof parsed === 'object' && parsed.text) {
              parsedContent = parsed.text;
            }
          } catch {
            // Not JSON, use as-is
            parsedContent = msg.content;
          }
        }
        
        return {
          role: msg.role,
          content: parsedContent,
          files: files.length > 0 ? files : undefined
        };
      });

      return {
        title,
        messages
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
    
    // Add conversation messages if available
    if (context.conversationMessages && context.conversationMessages.length > 0) {
      sections.push(`\n## Recent Conversation History`);
      sections.push(`The following are recent messages from the chat conversation that provide context about the user's thesis topic and direction:\n`);
      context.conversationMessages.forEach((msg, index) => {
        const roleLabel = msg.role === 'user' ? 'User' : 'Assistant';
        // Truncate very long messages to keep context manageable
        const content = msg.content.length > 500 
          ? msg.content.substring(0, 500) + '...' 
          : msg.content;
        sections.push(`**${roleLabel}:** ${content}`);
        
        // Include file attachments if present
        if (msg.files && msg.files.length > 0) {
          msg.files.forEach((file) => {
            sections.push(`  📎 **Attached File:** ${file.name} (${file.type})`);
            if (file.content) {
              sections.push(`  **File Content:**`);
              sections.push(`  \`\`\``);
              sections.push(`  ${file.content}`);
              sections.push(`  \`\`\``);
            }
          });
        }
      });
      
      // Also add a dedicated section for all file attachments for easy reference
      const allFiles = context.conversationMessages
        .filter(msg => msg.files && msg.files.length > 0)
        .flatMap(msg => msg.files || []);
      
      if (allFiles.length > 0) {
        sections.push(`\n## Attached Files from Conversation`);
        sections.push(`The user has shared the following files in the conversation:\n`);
        allFiles.forEach((file, index) => {
          sections.push(`### File ${index + 1}: ${file.name}`);
          sections.push(`**Type:** ${file.type}`);
          if (file.content) {
            sections.push(`**Content:**`);
            sections.push(`\`\`\``);
            sections.push(file.content);
            sections.push(`\`\`\``);
          } else {
            sections.push(`*(Binary file - content not available as text)*`);
          }
        });
      }
    }
    
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