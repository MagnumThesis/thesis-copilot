import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useIsMobile } from '../../hooks/use-mobile'

const MOBILE_BREAKPOINT = 768

describe('useIsMobile', () => {
  let originalInnerWidth: number
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    // Restore window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  const mockMatchMedia = (matches: boolean) => {
    const addEventListenerMock = vi.fn()
    const removeEventListenerMock = vi.fn()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      })),
    })

    return { addEventListenerMock, removeEventListenerMock }
  }

  const setInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    })
  }

  it('should return false initially when viewport is desktop', () => {
    setInnerWidth(1024)
    mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should return true initially when viewport is mobile', () => {
    setInnerWidth(500)
    mockMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should update state when resize event is triggered', () => {
    // Start with desktop
    setInnerWidth(1024)
    const { addEventListenerMock } = mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    // Simulate mobile resize
    setInnerWidth(500)

    // Trigger the change event listener
    const changeHandler = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'change'
    )?.[1]

    act(() => {
      if (changeHandler) {
        changeHandler(new Event('change'))
      }
    })

    expect(result.current).toBe(true)

    // Simulate desktop resize
    setInnerWidth(1024)

    act(() => {
      if (changeHandler) {
        changeHandler(new Event('change'))
      }
    })

    expect(result.current).toBe(false)
  })

  it('should cleanup event listener on unmount', () => {
    setInnerWidth(1024)
    const { addEventListenerMock, removeEventListenerMock } = mockMatchMedia(false)

    const { unmount } = renderHook(() => useIsMobile())

    const changeHandler = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'change'
    )?.[1]

    unmount()

    expect(removeEventListenerMock).toHaveBeenCalledWith('change', changeHandler)
  })
})
