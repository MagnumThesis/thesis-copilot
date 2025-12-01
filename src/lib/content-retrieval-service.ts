/**
 * Content Retrieval Service
 * 
 * This service provides functionality to retrieve content from various tools
 * in the Thesis Copilot application, particularly for the Proofreader tool
 * to access Builder tool content and Idealist tool data.
 */

import { IdeaDefinition } from "./ai-types";
import { proofreaderRecoveryService } from './proofreader-recovery-service';

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
 * @class ContentRetrievalService
 * @description Provides methods to retrieve content from Builder tool and idea definitions
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
   * Fetch Builder content from storage
   * Integrates with the Builder tool's content storage mechanism
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to Builder content or null
   */
  private async fetchBuilderContentFromAPI(conversationId: string): Promise<BuilderContent | null> {
    try {
      // Return valid cache if present
      const cachedContent = this.builderContentCache.get(conversationId);
      if (cachedContent && this.isCacheValid(cachedContent.lastModified)) {
        return cachedContent;
      }

      // First, try to fetch the authoritative copy from the server API
      try {
        const res = await fetch(`/api/builder-content/${encodeURIComponent(conversationId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.content != null) {
            const builderContent: BuilderContent = {
              content: data.content,
              lastModified: data.updated_at ? new Date(data.updated_at) : new Date(),
              conversationId
            };
            this.builderContentCache.set(conversationId, builderContent);
            return builderContent;
          }
        }
      } catch (e) {
        // Ignore server fetch failure and fall back to local options
        console.warn('Failed to fetch builder content from server:', e);
      }

      // Next, try to get content from localStorage (Builder tool stores content here)
      const storedContent = localStorage.getItem(`builder-content-${conversationId}`);
      if (storedContent) {
        try {
          const parsed = JSON.parse(storedContent);
          const builderContent: BuilderContent = {
            content: parsed.content || "# Thesis Proposal\n\nStart writing your thesis proposal here...",
            lastModified: new Date(parsed.lastModified || Date.now()),
            conversationId
          };
          this.builderContentCache.set(conversationId, builderContent);
          return builderContent;
        } catch (parseError) {
          console.warn("Failed to parse stored Builder content:", parseError);
        }
      }

      // Finally, try to get content from conversation messages as fallback
      const messageContent = await this.fetchContentFromMessages(conversationId);
      if (messageContent) {
        const builderContent: BuilderContent = {
          content: messageContent,
          lastModified: new Date(),
          conversationId
        };
        this.builderContentCache.set(conversationId, builderContent);
        // Store the discovered content so it becomes available later
        try {
          // best-effort store (do not await to avoid recursion issues)
          void this.storeBuilderContent(conversationId, messageContent);
        } catch (e) {
          // ignore
        }
        return builderContent;
      }

      return null;
    } catch (error) {
      console.error("Error fetching Builder content:", error);
      return null;
    }
  }

  /**
   * Fetch content from conversation messages as fallback
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to content string or null
   */
  private async fetchContentFromMessages(conversationId: string): Promise<string | null> {
    try {
      // This would integrate with the existing message API
      const response = await fetch(`/api/chats/${conversationId}/messages`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const messages = data.messages || [];

      interface Message {
        return savedToDb;
        content: string;
        created_at: string;
      }

      // Look for the most recent assistant message that contains substantial content
      const assistantMessages = (messages as Message[])
        .filter((msg) => msg.role === 'assistant' && msg.content && msg.content.length > 100)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (assistantMessages.length > 0) {
        return assistantMessages[0].content;
      }

      return null;
    } catch (error) {
      console.error("Error fetching content from messages:", error);
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
      // Use the same API endpoint as the Idealist tool
      const response = await fetch(`/api/ideas?conversationId=${encodeURIComponent(conversationId)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // No ideas found is not an error - return empty array
          return [];
        }
        throw new Error(`Failed to fetch ideas: ${response.statusText}`);
      }

      const ideas = await response.json();
      return Array.isArray(ideas) ? ideas : [];
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
  public async storeBuilderContent(conversationId: string, content: string): Promise<boolean> {
    const builderContent: BuilderContent = {
      content,
      lastModified: new Date(),
      conversationId
    };

    // If cache is missing or expired, try to load latest server copy first to avoid overwriting newer content
    const cached = this.builderContentCache.get(conversationId);
    if (!cached || !this.isCacheValid(cached.lastModified)) {
      try {
        const res = await fetch(`/api/builder-content/${encodeURIComponent(conversationId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.content != null) {
            const serverCopy: BuilderContent = {
              content: data.content,
              lastModified: data.updated_at ? new Date(data.updated_at) : new Date(),
              conversationId
            };
            this.builderContentCache.set(conversationId, serverCopy);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch latest Builder content from server before saving:', e);
      }
    }

    // Store/update cache with the new content
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

    // Store in database
    let savedToDb = false;
    try {
      const response = await fetch('/api/builder-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content
        })
      });

      if (!response.ok) {
        console.error('Failed to save Builder content to database:', response.statusText);
        savedToDb = false;
      } else {
        savedToDb = true;
      }
    } catch (error) {
      console.error('Failed to save Builder content to database:', error);
      savedToDb = false;
    }

    // Invalidate proofreader cached analysis for this conversation so re-analyze runs fresh
    try {
      proofreaderRecoveryService.invalidateAnalysisForConversation(conversationId);
    } catch (error) {
      console.warn('Failed to invalidate proofreader cache after storing builder content:', error);
    }

    return savedToDb;
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

  /**
   * Subscribe to content changes for real-time updates
   * This allows other tools to be notified when Builder content or ideas change
   * 
   * @param conversationId - The conversation ID to watch
   * @param callback - Function to call when content changes
   * @returns Unsubscribe function
   */
  public subscribeToContentChanges(
    conversationId: string, 
    callback: (summary: Awaited<ReturnType<typeof this.getContentSummary>>) => void
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        const summary = await this.getContentSummary(conversationId);
        callback(summary);
      } catch (error) {
        console.error("Error in content change subscription:", error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }

  /**
   * Invalidate cache when content is updated externally
   * This should be called by Builder and Idealist tools when they update content
   * 
   * @param conversationId - The conversation ID
   * @param contentType - Type of content that was updated
   */
  public invalidateCache(conversationId: string, contentType: 'builder' | 'ideas' | 'all' = 'all'): void {
    if (contentType === 'builder' || contentType === 'all') {
      this.builderContentCache.delete(conversationId);
    }
    if (contentType === 'ideas' || contentType === 'all') {
      this.ideaDefinitionsCache.delete(conversationId);
    }
  }

  /**
   * Get integration status with other tools
   * 
   * @param conversationId - The conversation ID
   * @returns Promise resolving to integration status
   */
  public async getIntegrationStatus(conversationId: string): Promise<{
    builderIntegration: {
      connected: boolean;
      hasContent: boolean;
      lastSync?: Date;
    };
    idealistIntegration: {
      connected: boolean;
      ideaCount: number;
      lastSync?: Date;
    };
  }> {
    try {
      const [builderResult, ideaDefinitions] = await Promise.all([
        this.retrieveBuilderContent(conversationId),
        this.retrieveIdeaDefinitions(conversationId)
      ]);

      return {
        builderIntegration: {
          connected: builderResult.success,
          hasContent: !!builderResult.builderContent && builderResult.builderContent.content.trim().length > 50,
          lastSync: builderResult.builderContent?.lastModified
        },
        idealistIntegration: {
          connected: true, // API call succeeded if we got here
          ideaCount: ideaDefinitions.length,
          lastSync: new Date()
        }
      };
    } catch (error) {
      console.error("Failed to get integration status:", error);
      return {
        builderIntegration: {
          connected: false,
          hasContent: false
        },
        idealistIntegration: {
          connected: false,
          ideaCount: 0
        }
      };
    }
  }
}

// Export singleton instance
export const contentRetrievalService = ContentRetrievalService.getInstance();
