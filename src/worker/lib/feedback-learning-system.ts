import { SearchResult, SearchFeedback } from './search-analytics-manager';

/**
 * Feedback Learning System
 * Implements machine learning algorithms to improve search results based on user feedback
 */

export interface UserPreferencePattern {
  userId: string;
  preferredAuthors: string[];
  preferredJournals: string[];
  preferredYearRange: { min: number; max: number };
  preferredCitationRange: { min: number; max: number };
  topicPreferences: Record<string, number>; // topic -> preference score
  qualityThreshold: number;
  relevanceThreshold: number;
  rejectionPatterns: {
    authors: string[];
    journals: string[];
    keywords: string[];
  };
  lastUpdated: Date;
}

export interface LearningMetrics {
  totalFeedbackCount: number;
  positiveRatings: number;
  negativeRatings: number;
  averageRating: number;
  improvementTrend: number; // positive = improving, negative = declining
  confidenceLevel: number; // how confident we are in the patterns
}

export interface AdaptiveFilter {
  type: 'author' | 'journal' | 'year' | 'citation' | 'topic' | 'quality';
  condition: 'include' | 'exclude' | 'boost' | 'penalize';
  value: string | number | { min: number; max: number };
  weight: number; // 0-1, how strongly to apply this filter
  confidence: number; // 0-1, how confident we are in this pattern
  source: 'explicit_feedback' | 'implicit_behavior' | 'pattern_recognition';
}

export class FeedbackLearningSystem {
  private env: any;

  constructor(env: any) {
    if (!env) {
      throw new Error('Environment object is required for FeedbackLearningSystem');
    }
    
    if (!env.DB) {
      console.warn('Database binding (DB) not found in environment - some features may be limited');
    }
    
    this.env = env;
  }

  /**
   * Check if database is available
   */
  private isDatabaseAvailable(): boolean {
    return !!(this.env && this.env.DB);
  }

  /**
   * Store user feedback for machine learning improvements
   */
  async storeFeedbackForLearning(
    userId: string,
    searchSessionId: string,
    resultId: string,
    feedback: {
      isRelevant: boolean;
      qualityRating: number;
      comments?: string;
      resultMetadata: {
        title: string;
        authors: string[];
        journal?: string;
        year?: number;
        citationCount: number;
        topics: string[];
      };
    }
  ): Promise<void> {
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, cannot store feedback for learning');
      return;
    }

    try {
      // Store the detailed feedback for learning
      await this.env.DB.prepare(`
        INSERT INTO user_feedback_learning (
          id, user_id, search_session_id, result_id, is_relevant, quality_rating,
          comments, result_title, result_authors, result_journal, result_year,
          citation_count, result_topics, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        searchSessionId,
        resultId,
        feedback.isRelevant,
        feedback.qualityRating,
        feedback.comments || null,
        feedback.resultMetadata.title,
        JSON.stringify(feedback.resultMetadata.authors),
        feedback.resultMetadata.journal || null,
        feedback.resultMetadata.year || null,
        feedback.resultMetadata.citationCount,
        JSON.stringify(feedback.resultMetadata.topics),
        new Date().toISOString()
      ).run();

      // Update user preference patterns
      await this.updateUserPreferencePatterns(userId, feedback);

      console.log(`Feedback stored for learning: ${userId} -> ${resultId}`);
    } catch (error) {
      console.error('Error storing feedback for learning:', error);
      throw error;
    }
  }

  /**
   * Update user preference patterns based on feedback
   */
  private async updateUserPreferencePatterns(
    userId: string,
    feedback: {
      isRelevant: boolean;
      qualityRating: number;
      resultMetadata: {
        authors: string[];
        journal?: string;
        year?: number;
        citationCount: number;
        topics: string[];
      };
    }
  ): Promise<void> {
    try {
      // Get existing patterns
      const existingPattern = await this.getUserPreferencePatterns(userId);
      
      // Update patterns based on feedback
      const updatedPattern = this.calculateUpdatedPatterns(existingPattern, feedback);
      
      // Store updated patterns
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO user_preference_patterns (
          user_id, preferred_authors, preferred_journals, preferred_year_range,
          preferred_citation_range, topic_preferences, quality_threshold,
          relevance_threshold, rejection_patterns, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        JSON.stringify(updatedPattern.preferredAuthors),
        JSON.stringify(updatedPattern.preferredJournals),
        JSON.stringify(updatedPattern.preferredYearRange),
        JSON.stringify(updatedPattern.preferredCitationRange),
        JSON.stringify(updatedPattern.topicPreferences),
        updatedPattern.qualityThreshold,
        updatedPattern.relevanceThreshold,
        JSON.stringify(updatedPattern.rejectionPatterns),
        new Date().toISOString()
      ).run();

    } catch (error) {
      console.error('Error updating user preference patterns:', error);
      throw error;
    }
  }

  /**
   * Get user preference patterns
   */
  async getUserPreferencePatterns(userId: string): Promise<UserPreferencePattern> {
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, returning default user preference patterns');
      return {
        userId,
        preferredAuthors: [],
        preferredJournals: [],
        preferredYearRange: { min: 2010, max: new Date().getFullYear() },
        preferredCitationRange: { min: 0, max: 10000 },
        topicPreferences: {},
        qualityThreshold: 0.5,
        relevanceThreshold: 0.5,
        rejectionPatterns: {
          authors: [],
          journals: [],
          keywords: []
        },
        lastUpdated: new Date()
      };
    }

    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM user_preference_patterns WHERE user_id = ?
      `).bind(userId).first();

      if (!result) {
        // Return default patterns for new users
        return {
          userId,
          preferredAuthors: [],
          preferredJournals: [],
          preferredYearRange: { min: 2010, max: new Date().getFullYear() },
          preferredCitationRange: { min: 0, max: 10000 },
          topicPreferences: {},
          qualityThreshold: 0.5,
          relevanceThreshold: 0.5,
          rejectionPatterns: {
            authors: [],
            journals: [],
            keywords: []
          },
          lastUpdated: new Date()
        };
      }

      return {
        userId: result.user_id,
        preferredAuthors: JSON.parse(result.preferred_authors || '[]'),
        preferredJournals: JSON.parse(result.preferred_journals || '[]'),
        preferredYearRange: JSON.parse(result.preferred_year_range || '{"min": 2010, "max": 2024}'),
        preferredCitationRange: JSON.parse(result.preferred_citation_range || '{"min": 0, "max": 10000}'),
        topicPreferences: JSON.parse(result.topic_preferences || '{}'),
        qualityThreshold: result.quality_threshold || 0.5,
        relevanceThreshold: result.relevance_threshold || 0.5,
        rejectionPatterns: JSON.parse(result.rejection_patterns || '{"authors": [], "journals": [], "keywords": []}'),
        lastUpdated: new Date(result.last_updated)
      };
    } catch (error) {
      console.error('Error getting user preference patterns:', error);
      throw error;
    }
  }

  /**
   * Calculate updated patterns based on new feedback
   */
  private calculateUpdatedPatterns(
    existingPattern: UserPreferencePattern,
    feedback: {
      isRelevant: boolean;
      qualityRating: number;
      resultMetadata: {
        authors: string[];
        journal?: string;
        year?: number;
        citationCount: number;
        topics: string[];
      };
    }
  ): UserPreferencePattern {
    const learningRate = 0.1; // How quickly to adapt to new feedback
    const { resultMetadata } = feedback;

    // Update author preferences
    const updatedAuthors = [...existingPattern.preferredAuthors];
    if (feedback.isRelevant && feedback.qualityRating >= 4) {
      // Add highly rated authors to preferences
      resultMetadata.authors.forEach(author => {
        if (!updatedAuthors.includes(author)) {
          updatedAuthors.push(author);
        }
      });
    }

    // Update journal preferences
    const updatedJournals = [...existingPattern.preferredJournals];
    if (feedback.isRelevant && feedback.qualityRating >= 4 && resultMetadata.journal) {
      if (!updatedJournals.includes(resultMetadata.journal)) {
        updatedJournals.push(resultMetadata.journal);
      }
    }

    // Update topic preferences
    const updatedTopicPreferences = { ...existingPattern.topicPreferences };
    resultMetadata.topics.forEach(topic => {
      const currentScore = updatedTopicPreferences[topic] || 0;
      const feedbackScore = feedback.isRelevant ? 
        (feedback.qualityRating / 5) : 
        -(feedback.qualityRating / 5);
      
      updatedTopicPreferences[topic] = currentScore + (learningRate * feedbackScore);
      
      // Keep scores in reasonable range
      updatedTopicPreferences[topic] = Math.max(-1, Math.min(1, updatedTopicPreferences[topic]));
    });

    // Update rejection patterns
    const updatedRejectionPatterns = { ...existingPattern.rejectionPatterns };
    if (!feedback.isRelevant || feedback.qualityRating <= 2) {
      // Add to rejection patterns
      if (resultMetadata.journal && !updatedRejectionPatterns.journals.includes(resultMetadata.journal)) {
        updatedRejectionPatterns.journals.push(resultMetadata.journal);
      }
      
      resultMetadata.authors.forEach(author => {
        if (!updatedRejectionPatterns.authors.includes(author)) {
          updatedRejectionPatterns.authors.push(author);
        }
      });
    }

    // Update thresholds based on feedback trends
    const qualityThreshold = existingPattern.qualityThreshold + 
      (learningRate * (feedback.qualityRating / 5 - existingPattern.qualityThreshold));
    
    const relevanceThreshold = existingPattern.relevanceThreshold + 
      (learningRate * (feedback.isRelevant ? 1 : 0 - existingPattern.relevanceThreshold));

    return {
      ...existingPattern,
      preferredAuthors: updatedAuthors.slice(-50), // Keep only recent 50
      preferredJournals: updatedJournals.slice(-30), // Keep only recent 30
      topicPreferences: updatedTopicPreferences,
      qualityThreshold: Math.max(0.1, Math.min(0.9, qualityThreshold)),
      relevanceThreshold: Math.max(0.1, Math.min(0.9, relevanceThreshold)),
      rejectionPatterns: {
        authors: updatedRejectionPatterns.authors.slice(-20),
        journals: updatedRejectionPatterns.journals.slice(-10),
        keywords: updatedRejectionPatterns.keywords.slice(-30)
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Apply feedback-based result ranking adjustments
   */
  async applyFeedbackBasedRanking(
    userId: string,
    searchResults: SearchResult[]
  ): Promise<SearchResult[]> {
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, returning original search results without learning adjustments');
      return searchResults;
    }

    try {
      const userPatterns = await this.getUserPreferencePatterns(userId);
      const adaptiveFilters = await this.generateAdaptiveFilters(userId);

      return searchResults.map(result => {
        let adjustedRelevanceScore = result.relevanceScore;
        let adjustedQualityScore = result.qualityScore;

        // Apply author preference boost/penalty
        const authorBoost = this.calculateAuthorBoost(result.resultAuthors, userPatterns);
        adjustedRelevanceScore += authorBoost * 0.2;

        // Apply journal preference boost/penalty
        const journalBoost = this.calculateJournalBoost(result.resultJournal, userPatterns);
        adjustedRelevanceScore += journalBoost * 0.15;

        // Apply topic preference adjustments
        const topicBoost = this.calculateTopicBoost(result, userPatterns);
        adjustedRelevanceScore += topicBoost * 0.25;

        // Apply adaptive filters
        const filterAdjustment = this.applyAdaptiveFilters(result, adaptiveFilters);
        adjustedRelevanceScore += filterAdjustment * 0.1;

        // Apply quality threshold filtering
        if (result.qualityScore < userPatterns.qualityThreshold) {
          adjustedQualityScore *= 0.7; // Penalize low quality results
        }

        // Ensure scores stay in valid range
        adjustedRelevanceScore = Math.max(0, Math.min(1, adjustedRelevanceScore));
        adjustedQualityScore = Math.max(0, Math.min(1, adjustedQualityScore));

        return {
          ...result,
          relevanceScore: adjustedRelevanceScore,
          qualityScore: adjustedQualityScore,
          // Add learning metadata
          learningAdjustments: {
            authorBoost,
            journalBoost,
            topicBoost,
            filterAdjustment,
            originalRelevanceScore: result.relevanceScore,
            originalQualityScore: result.qualityScore
          }
        };
      }).sort((a, b) => {
        // Sort by combined adjusted scores
        const scoreA = (a.relevanceScore * 0.6) + (a.qualityScore * 0.4);
        const scoreB = (b.relevanceScore * 0.6) + (b.qualityScore * 0.4);
        return scoreB - scoreA;
      });

    } catch (error) {
      console.error('Error applying feedback-based ranking:', error);
      // Return original results if learning fails
      return searchResults;
    }
  }

  /**
   * Generate adaptive search filters based on user patterns
   */
  async generateAdaptiveFilters(userId: string): Promise<AdaptiveFilter[]> {
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, returning empty adaptive filters');
      return [];
    }

    try {
      const userPatterns = await this.getUserPreferencePatterns(userId);
      const learningMetrics = await this.getLearningMetrics(userId);
      
      const filters: AdaptiveFilter[] = [];

      // Author filters
      if (userPatterns.preferredAuthors.length > 0) {
        filters.push({
          type: 'author',
          condition: 'boost',
          value: userPatterns.preferredAuthors.join('|'),
          weight: Math.min(0.8, learningMetrics.confidenceLevel),
          confidence: learningMetrics.confidenceLevel,
          source: 'pattern_recognition'
        });
      }

      // Journal filters
      if (userPatterns.preferredJournals.length > 0) {
        filters.push({
          type: 'journal',
          condition: 'boost',
          value: userPatterns.preferredJournals.join('|'),
          weight: Math.min(0.7, learningMetrics.confidenceLevel),
          confidence: learningMetrics.confidenceLevel,
          source: 'pattern_recognition'
        });
      }

      // Year range filter
      if (userPatterns.preferredYearRange.min > 2010 || userPatterns.preferredYearRange.max < new Date().getFullYear()) {
        filters.push({
          type: 'year',
          condition: 'include',
          value: userPatterns.preferredYearRange,
          weight: 0.5,
          confidence: learningMetrics.confidenceLevel,
          source: 'pattern_recognition'
        });
      }

      // Rejection filters
      if (userPatterns.rejectionPatterns.authors.length > 0) {
        filters.push({
          type: 'author',
          condition: 'penalize',
          value: userPatterns.rejectionPatterns.authors.join('|'),
          weight: 0.6,
          confidence: learningMetrics.confidenceLevel,
          source: 'explicit_feedback'
        });
      }

      if (userPatterns.rejectionPatterns.journals.length > 0) {
        filters.push({
          type: 'journal',
          condition: 'penalize',
          value: userPatterns.rejectionPatterns.journals.join('|'),
          weight: 0.5,
          confidence: learningMetrics.confidenceLevel,
          source: 'explicit_feedback'
        });
      }

      return filters;
    } catch (error) {
      console.error('Error generating adaptive filters:', error);
      return [];
    }
  }

  /**
   * Get learning metrics for a user
   */
  async getLearningMetrics(userId: string): Promise<LearningMetrics> {
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, returning default learning metrics');
      return {
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: 0,
        confidenceLevel: 0
      };
    }

    try {
      const result = await this.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_feedback,
          COUNT(CASE WHEN is_relevant = true AND quality_rating >= 4 THEN 1 END) as positive_ratings,
          COUNT(CASE WHEN is_relevant = false OR quality_rating <= 2 THEN 1 END) as negative_ratings,
          AVG(quality_rating) as average_rating
        FROM user_feedback_learning 
        WHERE user_id = ? AND created_at >= datetime('now', '-30 days')
      `).bind(userId).first();

      const totalFeedback = result?.total_feedback || 0;
      const positiveRatings = result?.positive_ratings || 0;
      const negativeRatings = result?.negative_ratings || 0;
      const averageRating = result?.average_rating || 0;

      // Calculate confidence level based on feedback volume and consistency
      const confidenceLevel = Math.min(1, totalFeedback / 20) * 
        (totalFeedback > 0 ? (positiveRatings / totalFeedback) : 0);

      // Calculate improvement trend (simplified)
      const improvementTrend = averageRating > 3 ? 0.1 : -0.1;

      return {
        totalFeedbackCount: totalFeedback,
        positiveRatings,
        negativeRatings,
        averageRating,
        improvementTrend,
        confidenceLevel
      };
    } catch (error) {
      console.error('Error getting learning metrics:', error);
      return {
        totalFeedbackCount: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        averageRating: 0,
        improvementTrend: 0,
        confidenceLevel: 0
      };
    }
  }

  // Helper methods for calculating boosts and adjustments

  private calculateAuthorBoost(authors: string[], patterns: UserPreferencePattern): number {
    let boost = 0;
    authors.forEach(author => {
      if (patterns.preferredAuthors.includes(author)) {
        boost += 0.3;
      }
      if (patterns.rejectionPatterns.authors.includes(author)) {
        boost -= 0.4;
      }
    });
    return Math.max(-0.5, Math.min(0.5, boost));
  }

  private calculateJournalBoost(journal: string | undefined, patterns: UserPreferencePattern): number {
    if (!journal) return 0;
    
    if (patterns.preferredJournals.includes(journal)) {
      return 0.2;
    }
    if (patterns.rejectionPatterns.journals.includes(journal)) {
      return -0.3;
    }
    return 0;
  }

  private calculateTopicBoost(result: SearchResult, patterns: UserPreferencePattern): number {
    // This would need topic extraction from result title/abstract
    // For now, simplified implementation
    let boost = 0;
    const resultText = `${result.resultTitle} ${result.resultJournal || ''}`.toLowerCase();
    
    Object.entries(patterns.topicPreferences).forEach(([topic, preference]) => {
      if (resultText.includes(topic.toLowerCase())) {
        boost += preference * 0.2;
      }
    });
    
    return Math.max(-0.3, Math.min(0.3, boost));
  }

  private applyAdaptiveFilters(result: SearchResult, filters: AdaptiveFilter[]): number {
    let adjustment = 0;
    
    filters.forEach(filter => {
      const filterValue = this.evaluateFilter(result, filter);
      adjustment += filterValue * filter.weight * filter.confidence;
    });
    
    return Math.max(-0.2, Math.min(0.2, adjustment));
  }

  private evaluateFilter(result: SearchResult, filter: AdaptiveFilter): number {
    switch (filter.type) {
      case 'author':
        const hasMatchingAuthor = result.resultAuthors.some(author => 
          typeof filter.value === 'string' && filter.value.includes(author)
        );
        return hasMatchingAuthor ? (filter.condition === 'boost' ? 1 : -1) : 0;
        
      case 'journal':
        const hasMatchingJournal = result.resultJournal && 
          typeof filter.value === 'string' && 
          filter.value.includes(result.resultJournal);
        return hasMatchingJournal ? (filter.condition === 'boost' ? 1 : -1) : 0;
        
      case 'year':
        if (typeof filter.value === 'object' && 'min' in filter.value && result.resultYear) {
          const inRange = result.resultYear >= filter.value.min && result.resultYear <= filter.value.max;
          return inRange ? 1 : (filter.condition === 'include' ? -1 : 0);
        }
        return 0;
        
      default:
        return 0;
    }
  }

  /**
   * Clear learning data for a user (privacy compliance)
   */
  async clearUserLearningData(userId: string): Promise<void> {
    // Check if DB is available
    if (!this.isDatabaseAvailable()) {
      console.warn('Database not available, cannot clear user learning data');
      return;
    }

    try {
      await this.env.DB.prepare(`DELETE FROM user_feedback_learning WHERE user_id = ?`).bind(userId).run();
      await this.env.DB.prepare(`DELETE FROM user_preference_patterns WHERE user_id = ?`).bind(userId).run();
      
      console.log(`Learning data cleared for user: ${userId}`);
    } catch (error) {
      console.error('Error clearing user learning data:', error);
      throw error;
    }
  }
}