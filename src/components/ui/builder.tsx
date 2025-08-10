"use client"

import React from "react"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"

interface BuilderProps {
  isOpen: boolean;
  onClose: () => void;
  currentConversation: { title: string; id: string };
}

export const Builder: React.FC<BuilderProps> = ({ isOpen, onClose, currentConversation }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>Builder</SheetTitle>
          <SheetDescription>
            Build and manage your thesis components for "{currentConversation.title}"
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
          {/* Placeholder content - will be enhanced later */}
          <div className="py-4 text-center text-muted-foreground">
            Builder content will be added here
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}