import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

type UseCopyToClipboardProps = {
  text: string
  copyMessage?: string
}

/**
 * @function useCopyToClipboard
 * @description A hook that provides functionality to copy text to the clipboard and provides visual feedback.
 * It uses the `navigator.clipboard.writeText` API and integrates with a toast notification system.
 * @param {UseCopyToClipboardProps} props - The properties for the copy to clipboard hook.
 * @param {string} props.text - The text to be copied to the clipboard.
 * @param {string} [props.copyMessage="Copied to clipboard!"] - The message to display in the toast notification upon successful copy.
 * @returns {{isCopied: boolean, handleCopy: () => void}}
 * - `isCopied`: A boolean indicating whether the text is currently in a copied state (resets after 2 seconds).
 * - `handleCopy`: A callback function to trigger the copy operation.
 */
export function useCopyToClipboard({
  text,
  copyMessage = "Copied to clipboard!",
}: UseCopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(copyMessage)
        setIsCopied(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard.")
      })
  }, [text, copyMessage])

  return { isCopied, handleCopy }
}
