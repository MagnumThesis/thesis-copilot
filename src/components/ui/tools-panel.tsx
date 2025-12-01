"use client"

import React, { useState, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/shadcn/button"
import { ToolCard } from "./tool-card"

// Dynamically import heavy components to reduce initial bundle size
const Idealist = lazy(() => import("./idealist").then(m => ({ default: m.Idealist })))
const Builder = lazy(() => import("./builder").then(m => ({ default: m.Builder })))
const Proofreader = lazy(() => import("./proofreader").then(m => ({ default: m.Proofreader })))
const Referencer = lazy(() => import("./referencer").then(m => ({ default: m.Referencer })))

interface ToolsPanelProps {
  className?: string
  children?: React.ReactNode
  currentConversation: { title: string; id: string } // Added prop for current conversation
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  className,
  children,
  currentConversation // Destructure the new prop
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isIdealistSheetOpen, setIsIdealistSheetOpen] = useState(false) // State for the Idealist sheet
  const [isBuilderSheetOpen, setIsBuilderSheetOpen] = useState(false) // State for the Builder sheet
  const [isProofreaderSheetOpen, setIsProofreaderSheetOpen] = useState(false) // State for the Proofreader sheet
  const [isReferencerSheetOpen, setIsReferencerSheetOpen] = useState(false) // State for the Referencer sheet

  const handleIdealistClick = () => {
    setIsIdealistSheetOpen(true)
  }

  const handleBuilderClick = () => {
    setIsBuilderSheetOpen(true)
  }

  const handleProofreaderClick = () => {
    setIsProofreaderSheetOpen(true)
  }

  const handleReferencerClick = () => {
    setIsReferencerSheetOpen(true)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "absolute top-4 z-10 h-8 w-8 rounded-full border bg-background shadow-sm hover:bg-muted transition-all duration-300",
          isOpen
            ? "-left-4" // Center when open
            : "-left-10" // More to the right when closed
        )}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Panel */}
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { width: 300, opacity: 1 },
          closed: { width: 0, opacity: 0 },
        }}
        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
        className="h-full overflow-hidden border-l bg-background"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-12 items-center gap-2 border-b px-4">
            <Wrench className="h-4 w-4" />
            <span className="font-medium">Tools</span>
          </div>
          {/* Display current conversation title if available */}
          {/* {currentConversation && (
            <div className="px-4 py-2 border-b">
              <h3 className="text-sm font-semibold">{currentConversation.title}</h3>
            </div>
          )} */}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4"> {/* Added space-y-4 for spacing between cards */}
            {children || (
              <>
                {/* Make Idealist clickable */}
                <div onClick={handleIdealistClick} className="cursor-pointer">
                  <ToolCard title="Idealist" description="Provides comprehensive information and definitions for your idea definitions." />
                </div>
                {/* Make Builder clickable */}
                <div onClick={handleBuilderClick} className="cursor-pointer">
                  <ToolCard title="Builder" description="Assists in the iterative development and refinement of proposals." />
                </div>
                {/* Make Proofreader clickable */}
                <div onClick={handleProofreaderClick} className="cursor-pointer">
                  <ToolCard title="Proofreader" description="Identifies potential loopholes and flaws within your ideas." />
                </div>
                {/* Make Referencer clickable */}
                <div onClick={handleReferencerClick} className="cursor-pointer">
                  <ToolCard title="Referencer" description="Searches for relevant academic papers and resources related to your ideas." />
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Idealist Sheet */}
      <Suspense fallback={null}>
        <Idealist isOpen={isIdealistSheetOpen} onClose={() => setIsIdealistSheetOpen(false)} currentConversation={currentConversation} />
      </Suspense>
      {/* Builder Sheet */}
      <Suspense fallback={null}>
        <Builder isOpen={isBuilderSheetOpen} onClose={() => setIsBuilderSheetOpen(false)} currentConversation={currentConversation} />
      </Suspense>
      {/* Proofreader Sheet */}
      <Suspense fallback={null}>
        <Proofreader isOpen={isProofreaderSheetOpen} onClose={() => setIsProofreaderSheetOpen(false)} currentConversation={currentConversation} />
      </Suspense>
      {/* Referencer Sheet */}
      <Suspense fallback={null}>
        <Referencer isOpen={isReferencerSheetOpen} onClose={() => setIsReferencerSheetOpen(false)} currentConversation={currentConversation} />
      </Suspense>
    </div>
  )
}
