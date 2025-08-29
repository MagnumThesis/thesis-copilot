import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAIModeManager } from '../../hooks/use-ai-mode-manager'
import { AIMode, ModificationType } from '../../lib/ai-infrastructure'

describe('useAIModeManager integration', () => {
  const conversationId = 'integration-test-convo'
  const documentContent = 'This is a short test document.'

  beforeEach(() => {
    // noop - keep clean between tests
  })

  it('exposes the expected API and composes child hooks', () => {
    const { result } = renderHook(() => useAIModeManager(conversationId, documentContent))

    // Basic API shape
    expect(result.current.currentMode).toBeDefined()
    expect(typeof result.current.setMode).toBe('function')
    expect(typeof result.current.resetMode).toBe('function')
    expect(typeof result.current.processPrompt).toBe('function')
    expect(typeof result.current.updateSelection).toBe('function')
    expect(typeof result.current.validateTextSelection).toBe('function')
    expect(typeof result.current.clearCache).toBe('function')

    // Compose behavior: changing mode updates currentMode
    act(() => {
      result.current.setMode(AIMode.PROMPT)
    })
    expect(result.current.currentMode).toBe(AIMode.PROMPT)

    // Selection validation is exposed and should accept a valid selection
    const selection = { start: 0, end: 4, text: 'This' }
    expect(result.current.validateTextSelection(selection)).toBe(true)

    // Clear cache is callable
    act(() => {
      result.current.clearCache()
    })
  })
})
