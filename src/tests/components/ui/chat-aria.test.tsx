import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Chat } from '../../../components/ui/chat'
import React from 'react'

test('Chat component renders rating buttons with aria-labels', () => {
  render(
    <Chat
      messages={[{ id: '1', role: 'assistant', content: 'Hello' }]}
      input=""
      handleInputChange={() => {}}
      handleSubmit={() => {}}
      isGenerating={false}
      onRateResponse={() => {}}
    />
  )

  const thumbsUpBtn = screen.getByLabelText('Thumbs up')
  const thumbsDownBtn = screen.getByLabelText('Thumbs down')

  expect(thumbsUpBtn).toBeInTheDocument()
  expect(thumbsDownBtn).toBeInTheDocument()
})
