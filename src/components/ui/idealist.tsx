"use client"

import React, { useState } from "react" // Re-added useState
import { ScrollArea } from "@/components/ui/scroll-area" // Import ScrollArea for scrollable content
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet" // Import Sheet components

// Interface for idea definitions
interface IdeaDefinition {
  id: number;
  title: string;
  description: string;
}

interface IdealistProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Idealist: React.FC<IdealistProps> = ({ isOpen, onClose }) => {
  // Initialize with an empty array, and use the IdeaDefinition type.
  const [ideaDefinitions, setIdeaDefinitions] = useState<IdeaDefinition[]>([]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Idea Definitions</SheetTitle>
          <SheetDescription>A list of your thesis idea definitions.</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4"> {/* Adjust height as needed */}
          {ideaDefinitions.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground"> {/* Centered placeholder text */}
              Add your idea definitions here
            </div>
          ) : (
            <div className="py-4 space-y-4">
              {ideaDefinitions.map((idea) => (
                <div key={idea.id} className="border p-3 rounded-md">
                  <h4 className="font-semibold">{idea.title}</h4>
                  <p className="text-sm text-muted-foreground">{idea.description}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
