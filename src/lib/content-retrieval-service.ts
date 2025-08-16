/**
 * Content Retrieval Service
 * 
 * This service provides functionality to retrieve content from various tools
 * in the Thesis Copilot application, particularly for the Proofreader tool
 * to access Builder tool content and Idealist tool data.
 */

import { IdeaDefinition } from "./ai-types";

export interface BuilderContent {
  content: string;
  lastModified: Date;
  conversationId: string;
}

export interface ContentRetrievalResult {
  success: boolean;
  builderContent?: BuilderContent;
  ideaDefinitions?: IdeaDefinition[];
  error?: string;
}

/**
 * Content Retrieval Service Class
 * 
 * Provides methods to retrieve content from Builder tool and idea definitions
 * from Idealist tool for use in proofreading analysis.
 */
export class ContentRetrievalService {
  private static instance: ContentRetrievalService;
  private builderContentCache = new Map<string, BuilderContent>();
  private ideaDefinitionsCache = new Map<string, IdeaDefinition[]>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): ContentRetrievalService {
    if (!ContentRetrievalService.instance) {
      ContentRetrievalService.instance = new ContentRetrievalService();
    }
    return ContentRetrievalService.instance;
  }

  /**
   * Retrieve content from Builder tool for a specific conversation
   * 
   * @param conversationId - The conversation ID to retrieve content for
   * @returns Promise resolving to content retrieval result
   */
  public async retrieveBuilderContent(conversationId: string): Promise<ContentRetrievalResult> {
    try {
      // Check cache first
      const cachedContent = this.builderContentCache.get(conversationId);
      if (cachedContent && this.isCacheValid(cachedContent.lastModified)) {
        return {
          success: true,
          builderContent: cachedContent
        };
      }

      // For now, we'll use a placeholder approach since Builder content is stored in component state
      // In a full implementation, this would retrieve from a centralized store or API
      const builderContent = await this.fetchBuilderContentFromAPI(conversationId);
      
      if (builderContent) {
        // Cache the result
        this.builderContentCache.set(conversationId, builderContent);
        
        return {
          success: true,
          builderContent
        };
      } else {
        return {
          success: false,
          error: "No content found in Builder tool. Please create some content first."
        };
      }
    } catch (error) {
      console.error("Failed to retrieve Builder content:", error);
      return {
        success: false,
        error: "Failed to retrieve content from Builder tool. Please try again."
      };
    }
  }

  /**
   * Retrieve idea definitions from Idealist tool for a specific conversation
   * 
   * @param conversationId - The conversation ID to retrieve ideas for
   * @returns Promise resolving to idea definitions
   */
  public async retrieveIdeaDefinitions(conversationId: string): Promise<IdeaDefinition[]> {
    try {
      // Check cache first
      const cachedIdeas = this.ideaDefinitionsCache.get(conversationId);
      if (cachedIdeas && this.isCacheValid(new Date())) {
        return cachedIdeas;
      }

      // Fetch from API
      const ideaDefinitions = await this.fetchIdeaDefinitionsFromAPI(conversationId);
      
      // Cache the result
      this.ideaDefinitionsCache.set(conversationId, ideaDefinitions);
      
      return ideaDefinitions;
    } catch (error) {
      console.error("Failed to retrieve idea definitions:", error);
      return []; // Return empty array on error to allow analysis to continue
    }
  }

  /**
   * Retrieve both Builder content and idea definitions for comprehensive analysis
   * 
   * @param conversationId - The conversation ID to retrieve data for
   * @returns Promise resolving to complete content retrieval result
   */
  public async retrieveAllContent(conversationId: string): Promise<ContentRetrievalResult> {
    try {
      const [builderResult, ideaDefinitions] = await Promise.all([
        this.retrieveBuilderContent(conversationId),
        this.retrieveIdeaDefinitions(conversationId)
      ]);

      if (!builderResult.success) {
        return builderResult;
      }

      return {
        success: true,
        builderContent: builderResult.builderContent,
        ideaDefinitions
      };
    } catch (error) {
      console.error("Failed to retrieve all content:", error);
      return {
        success: false,
        error: "Failed to retrieve content for analysis. Please try again."
      };
    }
  }

  /**
   * Clear cache for a specific conversation
   * 
   * @param conversationId - The conversation ID to clear cache for
   */
  public clearCache(conversationId: string): void {
    this.builderContentCache.delete(conversationId);
    this.ideaDefinitionsCache.delete(conversationId);
  }

  /**
   * Clear all cached content
   */
  public clearAllCache(): void {
    this.builderContentCache.clear();
    this.ideaDefinitionsCache.clear();
  }

  /**
   * Check if cached content is still valid
   * 
   * @param lastModified - The last modified date of cached content
   * @returns Whether the cache is still valid
   */
  private isCacheValid(lastModified: Date): boolean {
    return Date.now() - lastModified.getTime() < this.cacheExpiry;
  }

  /**
   * Fetch Builder content from API or storage
   * This is a placeholder implementation that would be replaced with actual API calls
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to Builder content or null
   */
  private async fetchBuilderContentFromAPI(conversationId: string): Promise<BuilderContent | null> {
    try {
      // For now, we'll try to get content from localStorage as a fallback
      // In a real implementation, this would be an API call to retrieve stored content
      const storedContent = localStorage.getItem(`builder-content-${conversationId}`);
      
      if (storedContent) {
        const parsed = JSON.parse(storedContent);
        return {
          content: parsed.content || "# Thesis Proposal\n\nStart writing your thesis proposal here...",
          lastModified: new Date(parsed.lastModified || Date.now()),
          conversationId
        };
      }

      // Return default content if nothing is stored
      return {
        content: "# Thesis Proposal\n\nStart writing your thesis proposal here...",
        lastModified: new Date(),
        conversationId
      };
    } catch (error) {
      console.error("Error fetching Builder content:", error);
      return null;
    }
  }

  /**
   * Fetch idea definitions from API
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to array of idea definitions
   */
  private async fetchIdeaDefinitionsFromAPI(conversationId: string): Promise<IdeaDefinition[]> {
    try {
      const response = await fetch(`/api/ideas/${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas: ${response.statusText}`);
      }

      const data = await response.json();
      return data.ideas || [];
    } catch (error) {
      console.error("Error fetching idea definitions:", error);
      return [];
    }
  }

  /**
   * Store Builder content (for integration with Builder component)
   * This method can be called by the Builder component to store content
   * 
   * @param conversationId - The conversation ID
   * @param content - The content to store
   */
  public storeBuilderContent(conversationId: string, content: string): void {
    const builderContent: BuilderContent = {
      content,
      lastModified: new Date(),
      conversationId
    };

    // Store in cache
    this.builderContentCache.set(conversationId, builderContent);

    // Store in localStorage as backup
    try {
      localStorage.setItem(`builder-content-${conversationId}`, JSON.stringify({
        content,
        lastModified: builderContent.lastModified.toISOString()
      }));
    } catch (error) {
      console.error("Failed to store content in localStorage:", error);
    }
  }

  /**
   * Check if Builder has content for analysis
   * 
   * @param conversationId - The conversation ID to check
   * @returns Promise resolving to whether content is available
   */
  public async hasBuilderContent(conversationId: string): Promise<boolean> {
    const result = await this.retrieveBuilderContent(conversationId);
    return result.success && 
           !!result.builderContent && 
           result.builderContent.content.trim().length > 50; // Minimum content length for analysis
  }

  /**
   * Get content summary for display purposes
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to content summary
   */
  public async getContentSummary(conversationId: string): Promise<{
    hasContent: boolean;
    contentLength: number;
    ideaCount: number;
    lastModified?: Date;
  }> {
    try {
      const [builderResult, ideaDefinitions] = await Promise.all([
        this.retrieveBuilderContent(conversationId),
        this.retrieveIdeaDefinitions(conversationId)
      ]);

      return {
        hasContent: builderResult.success && !!builderResult.builderContent,
        contentLength: builderResult.builderContent?.content.length || 0,
        ideaCount: ideaDefinitions.length,
        lastModified: builderResult.builderContent?.lastModified
      };
    } catch (error) {
      console.error("Failed to get content summary:", error);
      return {
        hasContent: false,
        contentLength: 0,
        ideaCount: 0
      };
    }
  }
}

// Export singleton instance
export const contentRetrievalService = ContentRetrievalService.getInstance();