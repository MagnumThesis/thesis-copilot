import { Hono, Context } from 'hono'
import { FeedbackLearningSystem } from '../lib/feedback-learning-system'
import { Env } from '../types/env'
import { SupabaseEnv, getSupabase } from '../lib/supabase'

// Type for the Hono context
type AISearcherLearningContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<AISearcherLearningContext>()

/**
 * Submit detailed feedback for learning system
 */
app.post('/feedback', async (c: Context<AISearcherLearningContext>) => {
  try {
    const { 
      userId, 
      searchSessionId, 
      resultId, 
      isRelevant, 
      qualityRating, 
      comments,
      resultMetadata 
    } = await c.req.json()

    if (!userId || !searchSessionId || !resultId || 
        typeof isRelevant !== 'boolean' || 
        typeof qualityRating !== 'number' ||
        !resultMetadata) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: userId, searchSessionId, resultId, isRelevant, qualityRating, resultMetadata' 
      }, 400)
    }

    // Validate quality rating
    if (qualityRating < 1 || qualityRating > 5) {
      return c.json({ 
        success: false, 
        error: 'Quality rating must be between 1 and 5' 
      }, 400)
    }

    // Validate result metadata
    if (!resultMetadata.title || !Array.isArray(resultMetadata.authors) || 
        !Array.isArray(resultMetadata.topics)) {
      return c.json({ 
        success: false, 
        error: 'Invalid result metadata format' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)

    await learningSystem.storeFeedbackForLearning(userId, searchSessionId, resultId, {
      isRelevant,
      qualityRating,
      comments,
      resultMetadata: {
        title: resultMetadata.title,
        authors: resultMetadata.authors,
        journal: resultMetadata.journal,
        year: resultMetadata.year,
        citationCount: resultMetadata.citationCount || 0,
        topics: resultMetadata.topics
      }
    })

    return c.json({ 
      success: true, 
      message: 'Learning feedback submitted successfully' 
    })

  } catch (error) {
    console.error('Error submitting learning feedback:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Apply learning-based ranking to search results
 */
app.post('/apply-ranking', async (c) => {
  try {
    const { userId, searchResults } = await c.req.json()

    if (!userId || !Array.isArray(searchResults)) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: userId, searchResults' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)
    const rankedResults = await learningSystem.applyFeedbackBasedRanking(userId, searchResults)

    return c.json({ 
      success: true, 
      results: rankedResults,
      message: 'Learning-based ranking applied successfully' 
    })

  } catch (error) {
    console.error('Error applying learning-based ranking:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Get user preference patterns
 */
app.get('/preferences/:userId', async (c: Context<AISearcherLearningContext>) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)
    const preferences = await learningSystem.getUserPreferencePatterns(userId)

    return c.json({ 
      success: true, 
      preferences,
      message: 'User preferences retrieved successfully' 
    })

  } catch (error) {
    console.error('Error getting user preferences:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Generate adaptive filters for a user
 */
app.get('/adaptive-filters/:userId', async (c: Context<AISearcherLearningContext>) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)
    const adaptiveFilters = await learningSystem.generateAdaptiveFilters(userId)

    return c.json({ 
      success: true, 
      filters: adaptiveFilters,
      message: 'Adaptive filters generated successfully' 
    })

  } catch (error) {
    console.error('Error generating adaptive filters:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Get learning metrics for a user
 */
app.get('/metrics/:userId', async (c: Context<AISearcherLearningContext>) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)
    const metrics = await learningSystem.getLearningMetrics(userId)

    return c.json({ 
      success: true, 
      metrics,
      message: 'Learning metrics retrieved successfully' 
    })

  } catch (error) {
    console.error('Error getting learning metrics:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Clear user learning data (privacy compliance)
 */
app.delete('/user-data/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')

    if (!userId) {
      return c.json({ 
        success: false, 
        error: 'User ID is required' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)
    await learningSystem.clearUserLearningData(userId)

    return c.json({ 
      success: true, 
      message: 'User learning data cleared successfully' 
    })

  } catch (error) {
    console.error('Error clearing user learning data:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Batch update learning patterns (for background processing)
 */
app.post('/batch-update', async (c) => {
  try {
    const { feedbackBatch } = await c.req.json()

    if (!Array.isArray(feedbackBatch)) {
      return c.json({ 
        success: false, 
        error: 'feedbackBatch must be an array' 
      }, 400)
    }

    const learningSystem = new FeedbackLearningSystem(c.env)
    const results = []

    for (const feedback of feedbackBatch) {
      try {
        await learningSystem.storeFeedbackForLearning(
          feedback.userId,
          feedback.searchSessionId,
          feedback.resultId,
          feedback.feedbackData
        )
        results.push({ success: true, resultId: feedback.resultId })
      } catch (error) {
        console.error(`Error processing feedback for ${feedback.resultId}:`, error)
        results.push({ 
          success: false, 
          resultId: feedback.resultId, 
          error: (error as Error).message 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return c.json({ 
      success: true, 
      processed: results.length,
      successful: successCount,
      failed: failureCount,
      results,
      message: `Batch update completed: ${successCount} successful, ${failureCount} failed` 
    })

  } catch (error) {
    console.error('Error processing batch update:', error)
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500)
  }
})

/**
 * Get learning system status and health
 */
app.get('/status', async (c: Context<AISearcherLearningContext>) => {
  try {
    const supabase = getSupabase(c.env as any)

    // Total users (distinct user_id count)
    const { error: usersError, count: usersCount } = await supabase
      .from('user_preference_patterns')
      .select('user_id', { count: 'exact' })

    if (usersError) throw usersError

    // Total feedback in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error: feedbackError, count: feedbackCount } = await supabase
      .from('user_feedback_learning')
      .select('*', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo)

    if (feedbackError) throw feedbackError

    // Active adaptive filters count
    const { error: filtersError, count: filtersCount } = await supabase
      .from('adaptive_filters')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    if (filtersError) throw filtersError

    // Average confidence from learning_metrics (compute in JS)
    const { data: metricsData, error: metricsError } = await supabase
      .from('learning_metrics')
      .select('confidence_level')

    if (metricsError) throw metricsError

    const confidenceValues = Array.isArray(metricsData) ? metricsData.map((r: any) => Number(r.confidence_level || 0)) : []
    const avgConfidenceValue = confidenceValues.length > 0 ? (confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length) : 0

    return c.json({
      status: 'healthy',
      stats: {
        totalUsers: usersCount || 0,
        totalFeedback: feedbackCount || 0,
        activeFilters: filtersCount || 0,
        avgConfidence: Number(avgConfidenceValue.toFixed(2))
      }
    })
  } catch (error) {
    console.error('Status check failed:', error)
    return c.json({ status: 'error', message: 'System health check failed' }, 500)
  }
})
    

export default app