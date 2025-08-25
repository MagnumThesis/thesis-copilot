/**
 * Search Result Management API Handlers
 * Handles bookmarking, comparison, export, and sharing endpoints
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { searchResultManagementService } from '../lib/search-result-management'
import { ScholarSearchResult } from '../../lib/ai-types'
import { ExportOptions, ShareOptions } from '../../types/search-result-types'

const app = new Hono()

// Enable CORS
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Bookmark endpoints
app.post('/bookmarks', async (c) => {
  try {
    const { result, userId, tags, notes } = await c.req.json()
    
    if (!result || !userId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const bookmarkedResult = await searchResultManagementService.bookmarkResult(
      result as ScholarSearchResult,
      userId,
      tags,
      notes
    )

    return c.json({
      success: true,
      bookmark: bookmarkedResult
    })
  } catch (error) {
    console.error('Error bookmarking result:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bookmark result'
    }, 500)
  }
})

app.delete('/bookmarks', async (c) => {
  try {
    const { result, userId } = await c.req.json()
    
    if (!result || !userId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    await searchResultManagementService.removeBookmark(
      result as ScholarSearchResult,
      userId
    )

    return c.json({ success: true })
  } catch (error) {
    console.error('Error removing bookmark:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove bookmark'
    }, 500)
  }
})

app.get('/bookmarks/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    if (!userId) {
      return c.json({ success: false, error: 'Missing user ID' }, 400)
    }

    const bookmarks = await searchResultManagementService.getBookmarkedResults(userId)

    return c.json({
      success: true,
      bookmarks
    })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bookmarks'
    }, 500)
  }
})

app.post('/bookmarks/check', async (c) => {
  try {
    const { result, userId } = await c.req.json()
    
    if (!result || !userId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const isBookmarked = await searchResultManagementService.isResultBookmarked(
      result as ScholarSearchResult,
      userId
    )

    return c.json({
      success: true,
      isBookmarked
    })
  } catch (error) {
    console.error('Error checking bookmark status:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check bookmark status'
    }, 500)
  }
})

// Comparison endpoints
app.post('/comparison', async (c) => {
  try {
    const { result, userId } = await c.req.json()
    
    if (!result || !userId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const comparisonResult = await searchResultManagementService.addToComparison(
      result as ScholarSearchResult,
      userId
    )

    return c.json({
      success: true,
      comparison: comparisonResult
    })
  } catch (error) {
    console.error('Error adding to comparison:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to comparison'
    }, 500)
  }
})

app.delete('/comparison', async (c) => {
  try {
    const { result, userId } = await c.req.json()
    
    if (!result || !userId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    await searchResultManagementService.removeFromComparison(
      result as ScholarSearchResult,
      userId
    )

    return c.json({ success: true })
  } catch (error) {
    console.error('Error removing from comparison:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from comparison'
    }, 500)
  }
})

app.get('/comparison/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    if (!userId) {
      return c.json({ success: false, error: 'Missing user ID' }, 400)
    }

    const comparisons = await searchResultManagementService.getComparisonResults(userId)

    return c.json({
      success: true,
      comparisons
    })
  } catch (error) {
    console.error('Error fetching comparisons:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch comparisons'
    }, 500)
  }
})

app.delete('/comparison/:userId', async (c) => {
  try {
    const userId = c.req.param('userId')
    
    if (!userId) {
      return c.json({ success: false, error: 'Missing user ID' }, 400)
    }

    await searchResultManagementService.clearComparison(userId)

    return c.json({ success: true })
  } catch (error) {
    console.error('Error clearing comparison:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear comparison'
    }, 500)
  }
})

// Export endpoint
app.post('/export', async (c) => {
  try {
    const { results, options } = await c.req.json()
    
    if (!results || !options) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const exportedContent = await searchResultManagementService.exportResults(
      results as ScholarSearchResult[],
      options as ExportOptions
    )

    return c.json({
      success: true,
      content: exportedContent,
      format: options.format,
      filename: options.filename
    })
  } catch (error) {
    console.error('Error exporting results:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export results'
    }, 500)
  }
})

// Sharing endpoints
app.post('/share', async (c) => {
  try {
    const { results, options, userId } = await c.req.json()
    
    if (!results || !options || !userId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400)
    }

    const sharedResult = await searchResultManagementService.shareResults(
      results as ScholarSearchResult[],
      options as ShareOptions,
      userId
    )

    return c.json({
      success: true,
      sharedResult
    })
  } catch (error) {
    console.error('Error sharing results:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share results'
    }, 500)
  }
})

app.get('/share/:shareId', async (c) => {
  try {
    const shareId = c.req.param('shareId')
    
    if (!shareId) {
      return c.json({ success: false, error: 'Missing share ID' }, 400)
    }

    const sharedResult = await searchResultManagementService.getSharedResult(shareId)

    if (!sharedResult) {
      return c.json({ success: false, error: 'Shared result not found or expired' }, 404)
    }

    // Update view count
    await searchResultManagementService.updateSharedResultViews(shareId)

    return c.json({
      success: true,
      sharedResult
    })
  } catch (error) {
    console.error('Error fetching shared result:', error)
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch shared result'
    }, 500)
  }
})

// Health check endpoint
app.get('/health', async (c) => {
  return c.json({
    success: true,
    service: 'search-result-management',
    timestamp: new Date().toISOString()
  })
})

export default app