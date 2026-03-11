import { expect, test } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolsPanel } from '../../../components/ui/tools-panel'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'

test('ToolsPanel component renders toggle button with aria-label', () => {
  render(
    <BrowserRouter>
      <ToolsPanel currentConversation={{ id: '1', title: 'Test' }} />
    </BrowserRouter>
  )

  const openBtn = screen.getByLabelText('Open tools panel')
  expect(openBtn).toBeInTheDocument()

  fireEvent.click(openBtn)

  const closeBtn = screen.getByLabelText('Close tools panel')
  expect(closeBtn).toBeInTheDocument()
})
