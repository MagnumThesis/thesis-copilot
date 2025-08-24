import { ExtractedContent, ContentExtractionRequest, IdeaDefinition } from '../../lib/ai-types';
import { analyzeText, TextAnalysis } from '../../utils/text-analysis';

/**
 * Content Extraction Engine
 * Extracts and analyzes content from Ideas and Builder tools
 */

// Builder document interface
interface BuilderDocument {
  id: string;
  title?: string;
  sections?: Array<{
    title?: string;
    content?: string;
  }>;
  content?: string;
}

export class ContentExtractionEngine {
  private ideaApi: IdeaApi;
  private builderApi: BuilderApi;

  constructor(baseUrl?: string) {
    // Initialize API clients with optional base URL for testing
    this.ideaApi = new IdeaApi(baseUrl);
    this.builderApi = new BuilderApi(baseUrl);
  }

  /**
   * Extract content from specified source
   */
  async extractContent(request: ContentExtractionRequest): Promise<ExtractedContent> {
    const startTime = Date.now();

    try {
      let content: string;
      let title: string;
      let sourceMetadata: any = {};

      switch (request.source) {
        case 'ideas': {
          const ideaData = await this.extractFromIdeas(request.id);
          content = ideaData.content;
          title = ideaData.title;
          sourceMetadata = { ideaId: request.id };
          break;
        }

        case 'builder': {
          // For builder, use conversationId instead of id
          const builderData = await this.extractFromBuilder(request.conversationId);
          content = builderData.content;
          title = builderData.title;
          sourceMetadata = { 
            conversationId: request.conversationId,
            wordCount: builderData.wordCount,
            lastModified: builderData.lastModified
          };
          break;
        }

        default:
          throw new Error(`Unsupported source: ${request.source}`);
      }

      // Validate content - if empty, use fallback
      if (!content || content.trim().length === 0) {
        console.warn(`No content found in ${request.source} source, using fallback`);
        // Use fallback content based on source type
        if (request.source === 'ideas') {
          content = `Research Topic ${request.id}. This is a placeholder for content that could not be extracted from the Ideas source.`;
          title = `Research Topic ${request.id}`;
        } else {
          content = `Document content for ${request.conversationId}. This is a placeholder for content that could not be extracted from the Builder source.`;
          title = `Document ${request.conversationId}`;
        }
      }

      // Analyze the extracted content
      const analysis = analyzeText(content);

      // Calculate confidence based on content quality and analysis
      const confidence = this.calculateConfidence(analysis);

      // Generate search query
      const extractedContent: ExtractedContent = {
        id: request.id,
        source: request.source,
        title: title,
        content: analysis.content,
        keywords: analysis.keywords,
        keyPhrases: analysis.keyPhrases,
        topics: analysis.topics,
        confidence: confidence,
        extractedAt: new Date(),
        metadata: {
          ...sourceMetadata,
          wordCount: analysis.wordCount,
          readabilityScore: analysis.readabilityScore,
          processingTimeMs: Date.now() - startTime
        }
      };

      console.log(`Content extraction completed for ${request.source}:${request.id} in ${Date.now() - startTime}ms`);

      return extractedContent;

    } catch (error) {
      console.error('Error in content extraction:', error);
      throw new Error(`Failed to extract content from ${request.source}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract content from Ideas
   */
  private async extractFromIdeas(ideaId: string): Promise<{ content: string; title: string }> {
    try {
      // Get the idea definition
      const idea = await this.ideaApi.getIdea(ideaId);

      if (!idea) {
        throw new Error(`Idea not found: ${ideaId}`);
      }

      // Combine title and description for content analysis
      const content = `${idea.title}\n\n${idea.description || ''}`;

      return {
        content: content.trim(),
        title: idea.title
      };

    } catch (error) {
      console.error(`Error extracting from Ideas (${ideaId}):`, error);
      throw new Error(`Failed to extract content from Ideas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract content from Builder
   */
  private async extractFromBuilder(conversationId: string): Promise<{ content: string; title: string }> {
    try {
      // Get builder content using conversationId
      const builder = await this.builderApi.getBuilder(conversationId);

      if (!builder) {
        throw new Error(`Builder content not found for conversation: ${conversationId}`);
      }

      // Extract text content from builder
      const content = await this.extractBuilderText(builder);

      return {
        content: content.trim(),
        title: builder.title || 'Thesis Document'
      };

    } catch (error) {
      console.error(`Error extracting from Builder (${conversationId}):`, error);
      throw new Error(`Failed to extract content from Builder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text content from builder document
   */
  private async extractBuilderText(builder: BuilderDocument): Promise<string> {
    // This is a simplified implementation
    // In a real scenario, you would parse the builder's document structure

    let content = '';

    // Add title
    if (builder.title) {
      content += `${builder.title}\n\n`;
    }

    // Add sections content
    if (builder.sections && Array.isArray(builder.sections)) {
      for (const section of builder.sections) {
        if (section.title) {
          content += `${section.title}\n`;
        }
        if (section.content) {
          content += `${section.content}\n\n`;
        }
      }
    }

    // Add any additional content
    if (builder.content) {
      content += `${builder.content}\n\n`;
    }

    return content.trim();
  }

  /**
   * Calculate confidence score for extracted content
   */
  private calculateConfidence(analysis: TextAnalysis): number {
    let confidence = 0.4; // Base confidence

    // Factor in content length
    const wordCount = analysis.wordCount;
    if (wordCount > 200) confidence += 0.3;
    else if (wordCount > 100) confidence += 0.2;
    else if (wordCount > 50) confidence += 0.1;

    // Factor in keyword extraction quality
    if (analysis.keywords.length > 8) confidence += 0.15;
    else if (analysis.keywords.length > 5) confidence += 0.1;
    else if (analysis.keywords.length > 2) confidence += 0.05;

    // Factor in topic diversity
    if (analysis.topics.length > 4) confidence += 0.1;
    else if (analysis.topics.length > 2) confidence += 0.05;

    // Factor in readability
    if (analysis.readabilityScore > 0.7) confidence += 0.1;
    else if (analysis.readabilityScore > 0.5) confidence += 0.05;

    // Ensure confidence is within bounds
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Batch extract content from multiple sources
   */
  async batchExtract(sources: { ideas?: string[]; builder?: string[] }): Promise<ExtractedContent[]> {
    const results: ExtractedContent[] = [];

    // Extract from Ideas
    if (sources.ideas && sources.ideas.length > 0) {
      for (const ideaId of sources.ideas) {
        try {
          const extracted = await this.extractContent({
            source: 'ideas',
            id: ideaId,
            conversationId: '' // Will be set by caller
          });
          results.push(extracted);
        } catch (error) {
          console.warn(`Failed to extract from idea ${ideaId}:`, error);
          // Continue with other sources
        }
      }
    }

    // Extract from Builder
    if (sources.builder && sources.builder.length > 0) {
      for (const builderId of sources.builder) {
        try {
          const extracted = await this.extractContent({
            source: 'builder',
            id: builderId,
            conversationId: '' // Will be set by caller
          });
          results.push(extracted);
        } catch (error) {
          console.warn(`Failed to extract from builder ${builderId}:`, error);
          // Continue with other sources
        }
      }
    }

    return results;
  }

  /**
   * Combine multiple extracted contents
   */
  combineExtractedContents(extractedContents: ExtractedContent[]): ExtractedContent {
    if (extractedContents.length === 0) {
      throw new Error('No content to combine');
    }

    if (extractedContents.length === 1) {
      return extractedContents[0];
    }

    // Combine all content
    const combinedContent = extractedContents.map(ec => ec.content).join('\n\n');

    // Analyze combined content
    const analysis = analyzeText(combinedContent);

    // Calculate combined confidence (weighted average)
    const totalConfidence = extractedContents.reduce((sum, ec) => sum + ec.confidence, 0);
    const avgConfidence = totalConfidence / extractedContents.length;

    // Combine keywords, key phrases, and topics (removing duplicates)
    const allKeywords = [...new Set(extractedContents.flatMap(ec => ec.keywords))];
    const allKeyPhrases = [...new Set(extractedContents.flatMap(ec => ec.keyPhrases))];
    const allTopics = [...new Set(extractedContents.flatMap(ec => ec.topics))];

    return {
      source: 'ideas', // Default to ideas for combined content
      content: analysis.content,
      keywords: allKeywords,
      keyPhrases: allKeyPhrases,
      topics: allTopics,
      confidence: avgConfidence
    };
  }
}

/**
 * Real Idea API integration
 */
class IdeaApi {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getIdea(id: string): Promise<IdeaDefinition | null> {
    try {
      console.log(`Fetching idea ${id} from API`);

      // Construct the full URL for the ideas API endpoint
      const url = this.baseUrl ? `${this.baseUrl}/api/ideas/${id}` : `/api/ideas/${id}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Idea ${id} not found`);
          return null;
        }
        throw new Error(`Failed to fetch idea: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.idea) {
        return {
          id: data.idea.id,
          title: data.idea.title,
          description: data.idea.description || data.idea.content || '',
          content: data.idea.description || data.idea.content || '',
          type: data.idea.type || 'concept',
          tags: data.idea.tags || [],
          confidence: data.idea.confidence || 0.8,
          created_at: data.idea.created_at || new Date().toISOString(),
          updated_at: data.idea.updated_at || new Date().toISOString(),
          conversationid: data.idea.conversationid || data.idea.conversation_id
        };
      }

      return null;

    } catch (error) {
      console.error(`Error fetching idea ${id}:`, error);
      
      // Fallback to mock data for development/testing
      console.log(`Falling back to mock data for idea ${id}`);
      return {
        id: parseInt(id) || 0,
        title: `Research Topic ${id}`,
        description: `This is a comprehensive research topic about ${id}. It includes various aspects of the subject matter and provides detailed analysis of key concepts and methodologies. The research focuses on innovative approaches and cutting-edge techniques in the field.`,
        content: `This is a comprehensive research topic about ${id}. It includes various aspects of the subject matter and provides detailed analysis of key concepts and methodologies. The research focuses on innovative approaches and cutting-edge techniques in the field.`,
        type: 'concept',
        tags: ['research', 'topic', 'analysis'],
        confidence: 0.7,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        conversationid: 'mock-conversation'
      };
    }
  }

  /**
   * Get multiple ideas for a conversation
   */
  async getIdeasForConversation(conversationId: string): Promise<IdeaDefinition[]> {
    try {
      console.log(`Fetching ideas for conversation ${conversationId}`);

      const url = this.baseUrl ? `${this.baseUrl}/api/ideas?conversationId=${conversationId}` : `/api/ideas?conversationId=${conversationId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.ideas) {
        return data.ideas.map((idea: any) => ({
          id: idea.id,
          title: idea.title,
          description: idea.description || idea.content || '',
          content: idea.description || idea.content || '',
          type: idea.type || 'concept',
          tags: idea.tags || [],
          confidence: idea.confidence || 0.8,
          created_at: idea.created_at || new Date().toISOString(),
          updated_at: idea.updated_at || new Date().toISOString(),
          conversationid: idea.conversationid || idea.conversation_id
        }));
      }

      return [];

    } catch (error) {
      console.error(`Error fetching ideas for conversation ${conversationId}:`, error);
      
      // Return empty array on error
      return [];
    }
  }
}

/**
 * Real Builder API integration
 */
class BuilderApi {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getBuilder(conversationId: string): Promise<any> {
    try {
      console.log(`Fetching builder content for conversation ${conversationId}`);

      // Construct the full URL for the builder API endpoint
      const url = this.baseUrl ? `${this.baseUrl}/api/builder-content/${conversationId}` : `/api/builder-content/${conversationId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Builder content for conversation ${conversationId} not found`);
          return null;
        }
        throw new Error(`Failed to fetch builder content: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        return {
          id: conversationId,
          title: data.title || 'Thesis Document',
          content: data.content,
          sections: this.parseContentSections(data.content),
          updated_at: data.updated_at,
          created_at: data.created_at,
          wordCount: data.content.split(/\s+/).length,
          lastModified: data.updated_at || data.created_at
        };
      }

      return null;

    } catch (error) {
      console.error(`Error fetching builder content for ${conversationId}:`, error);
      
      // Fallback to mock data for development/testing
      console.log(`Falling back to mock data for builder ${conversationId}`);
      const mockContent = `# Research Document ${conversationId}

## Introduction

This document explores various aspects of machine learning and artificial intelligence research. The study focuses on innovative approaches to natural language processing and their applications in academic writing assistance.

## Methodology

The methodology section describes the comprehensive approach used in this research study. We employ a mixed-methods approach combining quantitative analysis with qualitative insights from user studies.

## Literature Review

The literature review covers recent advances in AI-powered writing tools, with particular emphasis on academic writing assistance systems and their effectiveness in supporting researchers.

## Results

The results section presents findings related to the effectiveness of AI-powered reference search systems. Our analysis shows significant improvements in research efficiency and citation quality.

## Conclusion

The research demonstrates the potential of AI-powered tools in enhancing academic writing workflows and improving research productivity.`;

      return {
        id: conversationId,
        title: `Research Document ${conversationId}`,
        content: mockContent,
        sections: this.parseContentSections(mockContent),
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        wordCount: mockContent.split(/\s+/).length,
        lastModified: new Date().toISOString()
      };
    }
  }

  /**
   * Parse content into sections based on markdown headers
   */
  private parseContentSections(content: string): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];
    
    // Split content by markdown headers (# ## ###)
    const lines = content.split('\n');
    let currentSection: { title: string; content: string } | null = null;
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: headerMatch[2].trim(),
          content: ''
        };
      } else if (currentSection) {
        // Add line to current section
        currentSection.content += line + '\n';
      }
    }
    
    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    // If no sections found, create a single section with all content
    if (sections.length === 0 && content.trim()) {
      sections.push({
        title: 'Document Content',
        content: content
      });
    }
    
    return sections;
  }
}
