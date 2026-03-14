import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Chat } from '../../../components/ui/chat'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

describe('Chat Accessibility', () => {
  it('should have ARIA labels on icon buttons', () => {
    const messages = [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello, how can I help you today?',
        timestamp: new Date().toISOString(),
      }
    ]

    render(
      <QueryClientProvider client={queryClient}>
        <Chat
          messages={messages}
          onSendMessage={() => {}}
          onRateResponse={() => {}}
          isLoading={false}
          conversationId="test-id"
        />
      </QueryClientProvider>
    )

    // Check Thumbs Up
    const thumbsUpButton = screen.getByLabelText('Rate response thumbs up')
    expect(thumbsUpButton).toBeInTheDocument()

    // Check Thumbs Down
    const thumbsDownButton = screen.getByLabelText('Rate response thumbs down')
    expect(thumbsDownButton).toBeInTheDocument()
  })
})
