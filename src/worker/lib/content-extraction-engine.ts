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

  constructor() {
    // Initialize API clients
    this.ideaApi = new IdeaApi();
    this.builderApi = new BuilderApi();
  }

  /**
   * Extract content from specified source
   */
  async extractContent(request: ContentExtractionRequest): Promise<ExtractedContent> {
    const startTime = Date.now();

    try {
      let content: string;

      switch (request.source) {
        case 'ideas': {
          const ideaData = await this.extractFromIdeas(request.id);
          content = ideaData.content;
          break;
        }

        case 'builder': {
          const builderData = await this.extractFromBuilder(request.id);
          content = builderData.content;
          break;
        }

        default:
          throw new Error(`Unsupported source: ${request.source}`);
      }

      // Analyze the extracted content
      const analysis = analyzeText(content);

      // Generate search query
      const extractedContent: ExtractedContent = {
        source: request.source,
        content: analysis.content,
        keywords: analysis.keywords,
        keyPhrases: analysis.keyPhrases,
        topics: analysis.topics,
        confidence: this.calculateConfidence(analysis)
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
  private async extractFromBuilder(builderId: string): Promise<{ content: string; title: string }> {
    try {
      // Get builder content
      const builder = await this.builderApi.getBuilder(builderId);

      if (!builder) {
        throw new Error(`Builder not found: ${builderId}`);
      }

      // Extract text content from builder
      const content = await this.extractBuilderText(builder);

      return {
        content: content.trim(),
        title: builder.title || 'Builder Document'
      };

    } catch (error) {
      console.error(`Error extracting from Builder (${builderId}):`, error);
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
    let confidence = 0.5; // Base confidence

    // Factor in content length
    const wordCount = analysis.wordCount;
    if (wordCount > 100) confidence += 0.2;
    else if (wordCount > 50) confidence += 0.1;

    // Factor in keyword extraction quality
    if (analysis.keywords.length > 5) confidence += 0.1;
    if (analysis.topics.length > 2) confidence += 0.1;

    // Factor in readability
    if (analysis.readabilityScore > 0.6) confidence += 0.1;

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
 * Mock Idea API for development/testing
 */
class IdeaApi {
  async getIdea(id: string): Promise<IdeaDefinition | null> {
    // Mock implementation
    console.log(`Mock: Getting idea ${id}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock data
    return {
      id: parseInt(id),
      title: `Research Topic ${id}`,
      description: `This is a comprehensive research topic about ${id}. It includes various aspects of the subject matter and provides detailed analysis of key concepts and methodologies.`,
      conversationid: 'mock-conversation'
    };
  }
}

/**
 * Mock Builder API for development/testing
 */
class BuilderApi {
  async getBuilder(id: string): Promise<any> {
    // Mock implementation
    console.log(`Mock: Getting builder ${id}`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock data
    return {
      id,
      title: `Research Document ${id}`,
      sections: [
        {
          title: 'Introduction',
          content: `This document explores various aspects of ${id} in detail.`
        },
        {
          title: 'Methodology',
          content: `The methodology section describes the approach used in this ${id} study.`
        },
        {
          title: 'Results',
          content: `The results section presents findings related to ${id}.`
        }
      ],
      content: `Additional content about ${id} that provides more context and details for the research.`
    };
  }
}
