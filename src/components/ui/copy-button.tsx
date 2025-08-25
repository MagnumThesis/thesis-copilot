import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/shadcn/button"

type CopyButtonProps = {
  content: string
  copyMessage?: string
}

/**
 * A button component that allows users to copy specified content to the clipboard.
 * It provides visual feedback (a checkmark) when the content is successfully copied.
 * @param {CopyButtonProps} props - The properties for the CopyButton component.
 * @param {string} props.content - The text content to be copied to the clipboard.
 * @param {string} [props.copyMessage] - An optional message to display as a toast notification upon successful copy.
 * @example
 * ```tsx
 * <CopyButton content="Text to copy" copyMessage="Copied successfully!" />
 * ```
 */
export function CopyButton({ content, copyMessage }: CopyButtonProps) {
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: content,
    copyMessage,
  })

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-6 w-6"
      aria-label="Copy to clipboard"
      onClick={handleCopy}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Check
          className={cn(
            "h-4 w-4 transition-transform ease-in-out",
            isCopied ? "scale-100" : "scale-0"
          )}
        />
      </div>
      <Copy
        className={cn(
          "h-4 w-4 transition-transform ease-in-out",
          isCopied ? "scale-0" : "scale-100"
        )}
      />
    </Button>
  )
}
