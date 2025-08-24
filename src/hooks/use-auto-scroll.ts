import { useEffect, useRef, useState } from "react"

// How many pixels from the bottom of the container to enable auto-scroll
const ACTIVATION_THRESHOLD = 50
// Minimum pixels of scroll-up movement required to disable auto-scroll
const MIN_SCROLL_UP_THRESHOLD = 10

/**
 * @function useAutoScroll
 * @description A hook that provides auto-scrolling functionality for a scrollable container.
 * It automatically scrolls to the bottom when new content is added, unless the user has scrolled up.
 * @param {React.DependencyList} dependencies - Dependencies that, when changed, will trigger a scroll to bottom if auto-scroll is enabled.
 * @returns {{containerRef: React.RefObject<HTMLDivElement>, scrollToBottom: () => void, handleScroll: () => void, shouldAutoScroll: boolean, handleTouchStart: () => void}}
 * - `containerRef`: A ref to be attached to the scrollable container (e.g., a `div`).
 * - `scrollToBottom`: A function to manually scroll the container to the bottom.
 * - `handleScroll`: An event handler to be attached to the container's `onScroll` event.
 * - `shouldAutoScroll`: A boolean indicating whether auto-scrolling is currently active.
 * - `handleTouchStart`: An event handler to be attached to the container's `onTouchStart` event to disable auto-scroll on touch.
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previousScrollTop = useRef<number | null>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current

      const distanceFromBottom = Math.abs(
        scrollHeight - scrollTop - clientHeight
      )

      const isScrollingUp = previousScrollTop.current
        ? scrollTop < previousScrollTop.current
        : false

      const scrollUpDistance = previousScrollTop.current
        ? previousScrollTop.current - scrollTop
        : 0

      const isDeliberateScrollUp =
        isScrollingUp && scrollUpDistance > MIN_SCROLL_UP_THRESHOLD

      if (isDeliberateScrollUp) {
        setShouldAutoScroll(false)
      } else {
        const isScrolledToBottom = distanceFromBottom < ACTIVATION_THRESHOLD
        setShouldAutoScroll(isScrolledToBottom)
      }

      previousScrollTop.current = scrollTop
    }
  }

  const handleTouchStart = () => {
    setShouldAutoScroll(false)
  }

  useEffect(() => {
    if (containerRef.current) {
      previousScrollTop.current = containerRef.current.scrollTop
    }
  }, [])

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  }
}
