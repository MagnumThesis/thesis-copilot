import { Hono, Context } from 'hono'
import { SearchAnalyticsManager } from '../lib/search-analytics-manager'
import { Env } from '../types/env'
import { SupabaseEnv, getSupabase } from '../lib/supabase'

// Type for the Hono context
type AISearcherFeedbackContext = {
  Bindings: Env & SupabaseEnv;
};

const app = new Hono<AISearcherFeedbackContext>()

/**
 * Submit feedback for a specific search result
 */
app.post('/result', async (c: Context<AISearcherFeedbackContext>) => {
  try {
    const { searchSessionId, resultId, feedback } = await c.req.json()

    if (!searchSessionId || !resultId || !feedback) {
      return c.json({
        success: false,
        error: 'Missing required fields: searchSessionId, resultId, feedback'
      }, 400)
    }

    // Validate feedback structure
    if (typeof feedback.isRelevant !== 'boolean' ||
      typeof feedback.qualityRating !== 'number' ||
      feedback.qualityRating < 1 || feedback.qualityRating > 5) {
      return c.json({
        success: false,
        error: 'Invalid feedback format. isRelevant must be boolean, qualityRating must be 1-5'
      }, 400)
    }

    const analyticsManager = new SearchAnalyticsManager(c.env)
    const supabase = getSupabase(c.env as any)

    // Update the search result with user feedback using Supabase
    const title = resultId.split('-')[0]

    // Fetch existing row to preserve user_action if present
    const { data: existingRow, error: fetchError } = await supabase
      .from('search_results')
      .select('user_action')
      .match({ search_session_id: searchSessionId, result_title: title })
      .maybeSingle()

    if (fetchError) {
      console.warn('Failed to fetch existing search result row:', fetchError)

  }

  const userAction = (existingRow as any)?.user_action || (feedback.isRelevant ? 'viewed' : 'rejected')

    const { error: updateError } = await supabase
      .from('search_results')
      .update({
        user_feedback_rating: feedback.qualityRating,
        user_feedback_comments: feedback.comments || null,
        user_action: userAction
      })
      .match({ search_session_id: searchSessionId, result_title: title })

    if (updateError) throw updateError
    // Track the feedback for analytics
    try {
      await analyticsManager.updateSearchResultAction(
        resultId,
        feedback.isRelevant ? 'viewed' : 'rejected'
      )
    } catch (trackingError) {
      console.warn('Failed to track result feedback:', trackingError)
      // Don't fail the request if tracking fails
    }

    return c.json({
      success: true,
      message: 'Result feedback submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting result feedback:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * Submit feedback for an entire search session
 */
app.post('/session', async (c: Context<AISearcherFeedbackContext>) => {
  try {
    const { searchSessionId, conversationId, feedback } = await c.req.json()

    if (!searchSessionId || !conversationId || !feedback) {
      return c.json({
        success: false,
        error: 'Missing required fields: searchSessionId, conversationId, feedback'
      }, 400)
    }

    // Validate feedback structure
    const requiredRatings = ['overallSatisfaction', 'relevanceRating', 'qualityRating', 'easeOfUseRating']
    for (const rating of requiredRatings) {
      if (typeof feedback[rating] !== 'number' ||
        feedback[rating] < 1 || feedback[rating] > 5) {
        return c.json({
          success: false,
          error: `Invalid ${rating}. Must be a number between 1 and 5`
        }, 400)
      }
    }

    if (typeof feedback.wouldRecommend !== 'boolean') {
      return c.json({
        success: false,
        error: 'wouldRecommend must be a boolean'
      }, 400)
    }

    const analyticsManager = new SearchAnalyticsManager(c.env)
    const supabase = getSupabase(c.env as any)

    // Get user ID from the search session via Supabase
    const { data: sessionData, error: sessionError } = await supabase
      .from('search_sessions')
      .select('user_id')
      .eq('id', searchSessionId)
      .maybeSingle()

    if (sessionError || !sessionData) {
      return c.json({
        success: false,
        error: 'Search session not found'
      }, 404)
    }

    // Submit the session feedback
    const feedbackId = await analyticsManager.recordSearchFeedback({
      searchSessionId,
      userId: sessionData.user_id,
      overallSatisfaction: feedback.overallSatisfaction,
      relevanceRating: feedback.relevanceRating,
      qualityRating: feedback.qualityRating,
      easeOfUseRating: feedback.easeOfUseRating,
      feedbackComments: feedback.feedbackComments || undefined,
      wouldRecommend: feedback.wouldRecommend,
      improvementSuggestions: feedback.improvementSuggestions || undefined
    })

    return c.json({
      success: true,
      feedbackId,
      message: 'Session feedback submitted successfully'
    })

  } catch (error) {
    console.error('Error submitting session feedback:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * Submit detailed feedback for search analytics
 */
app.post('/analytics', async (c: Context<AISearcherFeedbackContext>) => {
  try {
    const conversationId = c.req.query('conversationId')
    const userId = c.req.query('userId')
    const days = parseInt(c.req.query('days') || '30')

    if (!conversationId && !userId) {
      return c.json({
        success: false,
        error: 'Either conversationId or userId is required'
      }, 400)
    }

    const analyticsManager = new SearchAnalyticsManager(c.env)

    // Get satisfaction metrics
    const satisfactionMetrics = await analyticsManager.getUserSatisfactionMetrics(
      userId || 'unknown',
      conversationId,
      days
    )

    // Get conversion metrics
    const conversionMetrics = await analyticsManager.getConversionMetrics(
      userId || 'unknown',
      conversationId,
      days
    )

    return c.json({
      success: true,
      analytics: {
        satisfaction: satisfactionMetrics,
        conversion: conversionMetrics,
        period: {
          days,
          start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error getting feedback analytics:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

/**
 * Get feedback for a specific search session
 */
app.get('/session/:sessionId', async (c: Context<AISearcherFeedbackContext>) => {
  try {
    const sessionId = c.req.param('sessionId')

    if (!sessionId) {
      return c.json({
        success: false,
        error: 'Session ID is required'
      }, 400)
    }

    const supabase = getSupabase(c.env as any)

    // Get session feedback
    const { data: sessionFeedback, error: sessionFeedbackError } = await supabase
      .from('search_feedback')
      .select('*')
      .eq('search_session_id', sessionId)
      .maybeSingle()

    if (sessionFeedbackError) throw sessionFeedbackError

    // Get result feedback
    const { data: resultFeedbackData, error: resultFeedbackError } = await supabase
      .from('search_results')
      .select(
        'result_title,user_feedback_rating,user_feedback_comments,user_action,relevance_score,quality_score'
      )
      .eq('search_session_id', sessionId)
      .not('user_feedback_rating', 'is', null)

    if (resultFeedbackError) throw resultFeedbackError

    return c.json({
      success: true,
      feedback: {
        session: sessionFeedback,
        results: resultFeedbackData || []
      }
    })

  } catch (error) {
    console.error('Error getting session feedback:', error)
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500)
  }
})

export default app