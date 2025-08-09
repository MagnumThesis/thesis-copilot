"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToolCard } from "./tool-card"

interface ToolsPanelProps {
  className?: string
  children?: React.ReactNode
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  className,
  children 
}) => {
  const [isOpen, setIsOpen] = useState(false)

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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4"> {/* Added space-y-4 for spacing between cards */}
            {children || (
              <>
                <ToolCard title="Idealist" description="Provides comprehensive information and definitions for your ideas." />
                <ToolCard title="Builder" description="Assists in the iterative development and refinement of proposals." />
                <ToolCard title="Proofreader" description="Identifies potential loopholes and flaws within your ideas." />
                <ToolCard title="Referencer" description="Searches for relevant academic papers and resources related to your ideas." />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
