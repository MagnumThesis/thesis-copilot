"use client"

import React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"

// Define the type for the currentConversation prop
interface Conversation {
  title: string;
  id: string;
}

interface ProofreaderProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversation: Conversation;
}

export const Proofreader: React.FC<ProofreaderProps> = ({ 
  isOpen, 
  onClose, 
  currentConversation 
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Proofreader</SheetTitle>
          <SheetDescription>
            Proofreading suggestions for conversation: {currentConversation.title}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
          <div className="py-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-md">
                <h3 className="font-medium">Grammar Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  No grammar issues detected.
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-medium">Style Improvements</h3>
                <p className="text-sm text-muted-foreground">
                  No style issues detected.
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="font-medium">Vocabulary Enhancements</h3>
                <p className="text-sm text-muted-foreground">
                  No vocabulary issues detected.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}