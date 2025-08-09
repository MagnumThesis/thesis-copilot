"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToolCard } from "./tool-card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet" // Import Sheet components
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea for scrollable content

interface ToolsPanelProps {
  className?: string
  children?: React.ReactNode
  currentConversation?: { title: string; id: string } // Added prop for current conversation
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ 
  className,
  children,
  currentConversation // Destructure the new prop
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false) // State for the sheet

  // Placeholder for ideas
  const ideas = [
    { id: 1, title: "Idea 1: AI-Powered Thesis Assistant", description: "An AI assistant to help with thesis writing, research, and citation." },
  ]

  const handleIdealistClick = () => {
    setIsSheetOpen(true)
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
          {currentConversation && (
            <div className="px-4 py-2 border-b">
              <h3 className="text-sm font-semibold">{currentConversation.title}</h3>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4"> {/* Added space-y-4 for spacing between cards */}
            {children || (
              <>
                {/* Make Idealist clickable */}
                <div onClick={handleIdealistClick} className="cursor-pointer">
                  <ToolCard title="Idealist" description="Provides comprehensive information and definitions for your ideas." />
                </div>
                <ToolCard title="Builder" description="Assists in the iterative development and refinement of proposals." />
                <ToolCard title="Proofreader" description="Identifies potential loopholes and flaws within your ideas." />
                <ToolCard title="Referencer" description="Searches for relevant academic papers and resources related to your ideas." />
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sheet for Ideas */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-[425px]">
          <SheetHeader>
            <SheetTitle>Your Ideas</SheetTitle>
            <SheetDescription>A list of your thesis ideas and their definitions.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-150px)] pr-4"> {/* Adjust height as needed */}
            <div className="py-4 space-y-4">
              {ideas.map((idea) => (
                <div key={idea.id} className="border p-3 rounded-md">
                  <h4 className="font-semibold">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground">{idea.description}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
