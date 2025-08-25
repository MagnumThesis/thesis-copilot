/**
 * Comprehensive Integration Tests for Proofreader AI Service and Database Operations
 * 
 * Tests integration between proofreader components, AI analysis engine,
 * database operations, and external services.
 * 
 * Requirements covered: 1.1, 2.1, 3.1, 6.1, 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

import { Proofreader } from '@/components/ui/proofreader'
import { ConcernAnalysisEngineImpl } from '@/worker/lib/concern-analysis-engine'
import { 
  proofreaderAnalysisHandler,
  getConcernsHandler,
  updateConcernStatusHandler,
  getConcernStatisticsHandler
} from '@/worker/handlers/proofreader-ai'
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernSeverity, 
  ConcernCategory,
  IdeaDefinition,
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse
} from '@/lib/ai-types'

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => mockQuery),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } }))
  }
}

const mockQuery = {
  select: vi.fn(() => mockQuery),
  eq: vi.fn(() => mockQuery),
  order: vi.fn(() => mockQuery),
  insert: vi.fn(() => mockQuery),
  update: vi.fn(() => mockQuery),
  delete: vi.fn(() => mockQuery),
  single: vi.fn(() => ({ data: null, error: null })),
  then: vi.fn((callback) => callback({ data: [], error: null }))
}

vi.mock('@/worker/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabase)
}))

// Mock Google AI
const mockGenerateContent = vi.fn()
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: mockGenerateContent
    }))
  }))
}))

global.fetch = vi.fn()

describe('Proofreader Integration Tests', () => {
  const mockConversation = { title: 'Integration Test Thesis', id: 'conv-int-123' }
  const mockUser = userEvent.setup()

  const mockThesisContent = `
    # Introduction
    This research investigates the impact of artificial intelligence on educational outcomes.
    The study examines how AI technologies enhance learning experiences through personalized approaches.
    
    # Literature Review
    Previous research demonstrates significant improvements in student engagement.
    Studies by Smith (2020) and Johnson (2019) show positive correlations between technology use and academic performance.
    However, limited research exists on AI-specific implementations in higher education contexts.
    
    # Research Questions
    1. How does AI-powered personalized learning affect student engagement levels?
    2. What factors influence the effectiveness of AI educational systems?
    3. How do students perceive AI-assisted learning environments?
    
    # Methodology
    This study employs a mixed-methods approach combining quantitative surveys and qualitative interviews.
    Data collection involves 200 undergraduate students across three universities over six months.
    Statistical analysis will utilize SPSS for quantitative data and thematic coding for qualitative responses.
  `

  const mockIdeaDefinitions: IdeaDefinition[] = [
    {
      id: 1,
      title: 'Artificial Intelligence in Education',
      description: 'The application of AI technologies to enhance teaching and learning processes'
    },
    {
      id: 2,
      title: 'Personalized Learning',
      description: 'Educational approaches that customize learning experiences based on individual student needs'
    },
    {
      id: 3,
      title: 'Student Engagement',
      description: 'The level of attention, curiosity, interest, and passion students show when learning'
    }
  ]

  const mockAnalysisResponse: ProofreaderAnalysisResponse = {
    success: true,
    concerns: [
      {
        id: 'int-concern-1',
        conversationId: 'conv-int-123',
        category: ConcernCategory.CITATIONS,
        severity: ConcernSeverity.MEDIUM,
        title: 'Incomplete citation format',
        description: 'Citations lack page numbers and proper formatting according to academic standards.',
        location: { section: 'Literature Review', paragraph: 2 },
        suggestions: ['Add page numbers to all citations', 'Follow APA format consistently'],
        relatedIdeas: ['1'],
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: 'int-concern-2',
        conversationId: 'conv-int-123',
        category: ConcernCategory.COMPLETENESS,
        severity: ConcernSeverity.HIGH,
        title: 'Missing theoretical framework',
        description: 'The proposal lacks a clear theoretical framework to guide the research.',
        location: { section: 'Introduction' },
        suggestions: ['Add theoretical framework section', 'Connect theory to research questions'],
        relatedIdeas: ['1', '2'],
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
      }
    ],
    analysisMetadata: {
      totalConcerns: 2,
      concernsByCategory: {
        citations: 1,
        completeness: 1
      },
      concernsBySeverity: {
        medium: 1,
        high: 1
      },
      analysisTime: 3200,
      contentLength: mockThesisContent.length,
      ideaDefinitionsUsed: 3
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock successful database operations
    mockQuery.select.mockReturnValue(mockQuery)
    mockQuery.eq.mockReturnValue(mockQuery)
    mockQuery.order.mockReturnValue({ data: mockAnalysisResponse.concerns, error: null })
    mockQuery.insert.mockReturnValue({ data: mockAnalysisResponse.concerns, error: null })
    mockQuery.update.mockReturnValue(mockQuery)
    mockQuery.single.mockReturnValue({ data: mockAnalysisResponse.concerns[0], error: null })

    // Mock AI service response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          concerns: mockAnalysisResponse.concerns.map(c => ({
            category: c.category,
            severity: c.severity,
            title: c.title,
            description: c.description,
            location: c.location,
            suggestions: c.suggestions
          }))
        })
      }
    })

    // Mock API endpoints
    vi.mocked(fetch).mockImplementation((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: {
              content: mockThesisContent,
              lastModified: new Date().toISOString()
            }
          }), { status: 200 }))
        }
        if (url.includes('/api/idealist/definitions/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            definitions: mockIdeaDefinitions
          }), { status: 200 }))
        }
        if (url.includes('/api/proofreader/analyze')) {
          return Promise.resolve(new Response(JSON.stringify(mockAnalysisResponse), { status: 200 }))
        }
        if (url.includes('/api/proofreader/concerns/')) {
          if (url.includes('/status')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              concern: { ...mockAnalysisResponse.concerns[0], status: ConcernStatus.ADDRESSED }
            }), { status: 200 }))
          } else {
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              concerns: mockAnalysisResponse.concerns
            }), { status: 200 }))
          }
        }
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }))
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AI Service Integration', () => {
    it('should integrate with Google Generative AI for content analysis', async () => {
      const analysisEngine = new ConcernAnalysisEngineImpl('test-api-key')
      
      const concerns = await analysisEngine.analyzeContent(
        mockThesisContent,
        mockIdeaDefinitions,
        mockConversation.id
      )

      expect(mockGenerateContent).toHaveBeenCalled()
      expect(concerns).toHaveLength(2)
      expect(concerns[0]).toMatchObject({
        category: ConcernCategory.CITATIONS,
        severity: ConcernSeverity.MEDIUM,
        title: 'Incomplete citation format'
      })
    })

    it('should handle AI service rate limiting gracefully', async () => {
      // Mock rate limit error
      mockGenerateContent.mockRejectedValueOnce(new Error('Rate limit exceeded'))

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(3000)

      await waitFor(() => {
        expect(screen.getByText(/rate limit/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should integrate idea definitions into AI analysis context', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify idea definitions are fetched
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/idealist/definitions/conv-int-123')
        )
      })

      // Verify they're included in analysis request
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/proofreader/analyze',
          expect.objectContaining({
            body: expect.stringContaining('ideaDefinitions')
          })
        )
      })

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText('Incomplete citation format')).toBeInTheDocument()
        expect(screen.getByText('Missing theoretical framework')).toBeInTheDocument()
      })
    })

    it('should handle AI service authentication errors', async () => {
      // Mock authentication error
      vi.mocked(fetch).mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({
          success: false,
          error: 'AI service authentication failed'
        }), { status: 401 }))
      )

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument()
      })
    })

    it('should validate AI response format and handle malformed responses', async () => {
      // Mock malformed AI response
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          text: () => 'Invalid JSON response'
        }
      })

      const analysisEngine = new ConcernAnalysisEngineImpl('test-api-key')
      
      await expect(
        analysisEngine.analyzeContent(mockThesisContent, mockIdeaDefinitions, mockConversation.id)
      ).rejects.toThrow()
    })
  })

  describe('Database Integration', () => {
    it('should persist analysis results to database correctly', async () => {
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            conversationId: mockConversation.id,
            documentContent: mockThesisContent,
            ideaDefinitions: mockIdeaDefinitions
          })
        },
        json: vi.fn(),
        env: {
          SUPABASE_URL: 'test-url',
          SUPABASE_ANON_KEY: 'test-key',
          GOOGLE_GENERATIVE_AI_API_KEY: 'test-ai-key'
        }
      }

      await proofreaderAnalysisHandler(mockContext as any)

      // Verify database insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('proofreading_concerns')
      expect(mockQuery.insert).toHaveBeenCalled()
    })

    it('should retrieve concerns from database with proper filtering', async () => {
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue(mockConversation.id),
          query: vi.fn().mockImplementation((key: string) => {
            if (key === 'status') return 'to_be_done'
            if (key === 'category') return 'citations'
            return ''
          })
        },
        json: vi.fn()
      }

      await getConcernsHandler(mockContext as any)

      expect(mockSupabase.from).toHaveBeenCalledWith('proofreading_concerns')
      expect(mockQuery.eq).toHaveBeenCalledWith('conversation_id', mockConversation.id)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'to_be_done')
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'citations')
    })

    it('should update concern status in database with validation', async () => {
      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue('int-concern-1'),
          json: vi.fn().mockResolvedValue({ status: 'addressed' })
        },
        json: vi.fn()
      }

      await updateConcernStatusHandler(mockContext as any)

      expect(mockSupabase.from).toHaveBeenCalledWith('proofreading_concerns')
      expect(mockQuery.update).toHaveBeenCalledWith({ 
        status: 'addressed',
        updated_at: expect.any(String)
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'int-concern-1')
    })

    it('should handle database connection failures gracefully', async () => {
      // Mock database error
      mockQuery.order.mockReturnValueOnce({ data: null, error: { message: 'Connection failed' } })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/connection failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('should maintain data integrity during concurrent operations', async () => {
      // Simulate concurrent status updates
      const updatePromises = []
      
      for (let i = 0; i < 5; i++) {
        const mockContext = {
          req: {
            param: vi.fn().mockReturnValue(`int-concern-${i}`),
            json: vi.fn().mockResolvedValue({ status: 'addressed' })
          },
          json: vi.fn()
        }
        
        updatePromises.push(updateConcernStatusHandler(mockContext as any))
      }

      await Promise.all(updatePromises)

      // All updates should complete successfully
      expect(mockQuery.update).toHaveBeenCalledTimes(5)
    })

    it('should generate accurate concern statistics from database', async () => {
      // Mock statistics query result
      mockQuery.eq.mockReturnValueOnce({
        data: [
          { category: 'citations', severity: 'medium', status: 'to_be_done' },
          { category: 'completeness', severity: 'high', status: 'to_be_done' },
          { category: 'clarity', severity: 'low', status: 'addressed' }
        ],
        error: null
      })

      const mockContext = {
        req: {
          param: vi.fn().mockReturnValue(mockConversation.id)
        },
        json: vi.fn()
      }

      await getConcernStatisticsHandler(mockContext as any)

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statistics: expect.objectContaining({
            total: 3,
            toBeDone: 2,
            addressed: 1,
            rejected: 0,
            byCategory: expect.objectContaining({
              citations: expect.any(Object),
              completeness: expect.any(Object),
              clarity: expect.any(Object)
            }),
            bySeverity: expect.objectContaining({
              medium: expect.any(Object),
              high: expect.any(Object),
              low: expect.any(Object)
            })
          })
        })
      )
    })
  })

  describe('Content Integration', () => {
    it('should integrate with Builder tool for content retrieval', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify Builder content is fetched
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/builder/content/conv-int-123')
        )
      })

      // Verify content is included in analysis
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          '/api/proofreader/analyze',
          expect.objectContaining({
            body: expect.stringContaining('documentContent')
          })
        )
      })
    })

    it('should handle missing or empty Builder content', async () => {
      // Mock empty content response
      vi.mocked(fetch).mockImplementationOnce((url) => {
        if (typeof url === 'string' && url.includes('/api/builder/content/')) {
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: { content: '' }
          }), { status: 200 }))
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
      })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/insufficient content/i)).toBeInTheDocument()
      })
    })

    it('should integrate with Idealist tool for contextual analysis', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      // Verify idea definitions are fetched
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/idealist/definitions/conv-int-123')
        )
      })

      vi.advanceTimersByTime(5000)

      // Verify concerns reference idea definitions
      await waitFor(() => {
        const concernWithIdeas = screen.getByText('Missing theoretical framework')
        expect(concernWithIdeas).toBeInTheDocument()
      })
    })

    it('should handle Idealist integration failures gracefully', async () => {
      // Mock Idealist service failure
      vi.mocked(fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/idealist/definitions/')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: false,
              error: 'Idealist service unavailable'
            }), { status: 503 }))
          }
          if (url.includes('/api/builder/content/')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              builderContent: { content: mockThesisContent }
            }), { status: 200 }))
          }
          if (url.includes('/api/proofreader/analyze')) {
            return Promise.resolve(new Response(JSON.stringify(mockAnalysisResponse), { status: 200 }))
          }
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
      })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(5000)

      // Analysis should still proceed without idea definitions
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should implement retry logic for transient failures', async () => {
      let callCount = 0
      vi.mocked(fetch).mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/proofreader/analyze')) {
          callCount++
          if (callCount < 3) {
            return Promise.reject(new Error('Network timeout'))
          }
          return Promise.resolve(new Response(JSON.stringify(mockAnalysisResponse), { status: 200 }))
        }
        return Promise.resolve(new Response(JSON.stringify({
          success: true,
          builderContent: { content: mockThesisContent }
        }), { status: 200 }))
      })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(10000) // Allow time for retries

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
      })

      // Should have retried multiple times
      expect(callCount).toBe(3)
    })

    it('should provide fallback analysis when AI service fails', async () => {
      // Mock AI service failure
      vi.mocked(fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/proofreader/analyze')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: false,
              error: 'AI service unavailable',
              fallbackConcerns: [
                {
                  id: 'fallback-1',
                  category: 'general',
                  severity: 'medium',
                  title: 'Basic content review needed',
                  description: 'Content requires manual review due to service unavailability.'
                }
              ]
            }), { status: 503 }))
          }
          return Promise.resolve(new Response(JSON.stringify({
            success: true,
            builderContent: { content: mockThesisContent }
          }), { status: 200 }))
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
      })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/service unavailable/i)).toBeInTheDocument()
        expect(screen.getByText(/basic content review/i)).toBeInTheDocument()
      })
    })

    it('should handle partial service failures gracefully', async () => {
      // Mock partial failure (Builder works, Idealist fails)
      vi.mocked(fetch).mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/idealist/definitions/')) {
            return Promise.reject(new Error('Idealist timeout'))
          }
          if (url.includes('/api/builder/content/')) {
            return Promise.resolve(new Response(JSON.stringify({
              success: true,
              builderContent: { content: mockThesisContent }
            }), { status: 200 }))
          }
          if (url.includes('/api/proofreader/analyze')) {
            return Promise.resolve(new Response(JSON.stringify({
              ...mockAnalysisResponse,
              analysisMetadata: {
                ...mockAnalysisResponse.analysisMetadata,
                ideaDefinitionsUsed: 0,
                warnings: ['Idea definitions unavailable - analysis may be less contextual']
              }
            }), { status: 200 }))
          }
        }
        return Promise.resolve(new Response('OK', { status: 200 }))
      })

      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument()
        expect(screen.getByText(/less contextual/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Consistency and Validation', () => {
    it('should validate concern data integrity across operations', async () => {
      render(
        <Proofreader 
          isOpen={true} 
          onClose={vi.fn()} 
          currentConversation={mockConversation} 
        />
      )

      // Perform analysis
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      await mockUser.click(analyzeButton)

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(screen.getByText('Incomplete citation format')).toBeInTheDocument()
      })

      // Update concern status
      const statusSelect = screen.getByRole('combobox', { name: /status/i })
      await mockUser.click(statusSelect)

      const addressedOption = screen.getByRole('option', { name: /addressed/i })
      await mockUser.click(addressedOption)

      // Verify data consistency
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/proofreader/concerns/int-concern-1/status'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ status: 'addressed' })
          })
        )
      })
    })

    it('should handle concurrent data modifications correctly', async () => {
      // Simulate concurrent status updates from different clients
      const updateRequests = Array.from({ length: 3 }, (_, i) => ({
        req: {
          param: vi.fn().mockReturnValue('int-concern-1'),
          json: vi.fn().mockResolvedValue({ 
            status: ['addressed', 'rejected', 'to_be_done'][i] 
          })
        },
        json: vi.fn()
      }))

      // Execute concurrent updates
      const updatePromises = updateRequests.map(context => 
        updateConcernStatusHandler(context as any)
      )

      await Promise.all(updatePromises)

      // Should handle all updates (last one wins)
      expect(mockQuery.update).toHaveBeenCalledTimes(3)
    })

    it('should maintain referential integrity with conversation data', async () => {
      const mockContext = {
        req: {
          json: vi.fn().mockResolvedValue({
            conversationId: 'non-existent-conv',
            documentContent: mockThesisContent,
            ideaDefinitions: []
          })
        },
        json: vi.fn(),
        env: {
          SUPABASE_URL: 'test-url',
          SUPABASE_ANON_KEY: 'test-key',
          GOOGLE_GENERATIVE_AI_API_KEY: 'test-ai-key'
        }
      }

      // Mock foreign key constraint error
      mockQuery.insert.mockReturnValueOnce({
        data: null,
        error: { message: 'Foreign key constraint violation' }
      })

      await proofreaderAnalysisHandler(mockContext as any)

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('conversation')
        }),
        400
      )
    })
  })
})