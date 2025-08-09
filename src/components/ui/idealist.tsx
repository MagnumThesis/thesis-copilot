"use client"

import React, { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea for scrollable content
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet" // Import Sheet components

interface IdealistProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Idealist: React.FC<IdealistProps> = ({ isOpen, onClose }) => {
  // Placeholder for idea definitions
  const [ideaDefinitions] = useState([
    { id: 1, title: "AI-Assisted Literature Review", description: "Utilizing natural language processing and machine learning to automate the process of identifying, summarizing, and synthesizing relevant academic literature for thesis research." },
    { id: 2, title: "Interactive Data Visualization for Thesis Findings", description: "Developing dynamic and interactive visualizations to effectively communicate complex data patterns and research outcomes in a thesis." },
    { id: 3, title: "Ethical Frameworks in AI Research", description: "Establishing and applying ethical guidelines and principles to the development and deployment of AI technologies within academic research contexts." },
  ])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Idea Definitions</SheetTitle>
          <SheetDescription>A list of your thesis idea definitions.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4"> {/* Adjust height as needed */}
          <div className="py-4 space-y-4">
            {ideaDefinitions.map((idea) => (
              <div key={idea.id} className="border p-3 rounded-md">
                <h4 className="font-semibold">{idea.title}</h4>
                <p className="text-sm text-muted-foreground">{idea.description}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
