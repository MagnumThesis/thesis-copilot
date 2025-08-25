import { useLayoutEffect, useRef } from "react"

interface UseAutosizeTextAreaProps {
  ref: React.RefObject<HTMLTextAreaElement | null>
  maxHeight?: number
  borderWidth?: number
  dependencies: React.DependencyList
}

/**
 * @function useAutosizeTextArea
 * @description A hook that automatically adjusts the height of a textarea to fit its content.
 * It prevents the textarea from growing beyond a specified `maxHeight` and ensures it doesn't shrink below its initial content height.
 * @param {UseAutosizeTextAreaProps} props - The properties for the autosize textarea hook.
 * @param {React.RefObject<HTMLTextAreaElement | null>} props.ref - A ref to the textarea element.
 * @param {number} [props.maxHeight=Number.MAX_SAFE_INTEGER] - The maximum height the textarea can grow to in pixels.
 * @param {number} [props.borderWidth=0] - The total width of the top and bottom borders of the textarea in pixels. This is added to the calculated height.
 * @param {React.DependencyList} props.dependencies - An array of dependencies that, when changed, will trigger a recalculation of the textarea height.
 */
export function useAutosizeTextArea({
  ref,
  maxHeight = Number.MAX_SAFE_INTEGER,
  borderWidth = 0,
  dependencies,
}: UseAutosizeTextAreaProps) {
  const originalHeight = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (!ref.current) return

    const currentRef = ref.current
    const borderAdjustment = borderWidth * 2

    if (originalHeight.current === null) {
      originalHeight.current = currentRef.scrollHeight - borderAdjustment
    }

    currentRef.style.removeProperty("height")
    const scrollHeight = currentRef.scrollHeight

    // Make sure we don't go over maxHeight
    const clampedToMax = Math.min(scrollHeight, maxHeight)
    // Make sure we don't go less than the original height
    const clampedToMin = Math.max(clampedToMax, originalHeight.current)

    currentRef.style.height = `${clampedToMin + borderAdjustment}px`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxHeight, ref, ...dependencies])
}
