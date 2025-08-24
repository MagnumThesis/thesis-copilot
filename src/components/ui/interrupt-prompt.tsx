"use client"

import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

interface InterruptPromptProps {
  isOpen: boolean
  close: () => void
}

/**
 * @component InterruptPrompt
 * @description A small, animated prompt that appears to instruct the user to press Enter again to interrupt an ongoing process.
 * @param {InterruptPromptProps} props - The properties for the InterruptPrompt component.
 * @param {boolean} props.isOpen - Controls the visibility of the prompt.
 * @param {() => void} props.close - Callback function to close the prompt.
 */
export function InterruptPrompt({ isOpen, close }: InterruptPromptProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ top: 0, filter: "blur(5px)" }}
          animate={{
            top: -40,
            filter: "blur(0px)",
            transition: {
              type: "spring",
              filter: { type: "tween" },
            },
          }}
          exit={{ top: 0, filter: "blur(5px)" }}
          className="absolute left-1/2 flex -translate-x-1/2 overflow-hidden whitespace-nowrap rounded-full border bg-background py-1 text-center text-sm text-muted-foreground"
        >
          <span className="ml-2.5">Press Enter again to interrupt</span>
          <button
            className="ml-1 mr-2.5 flex items-center"
            type="button"
            onClick={close}
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
