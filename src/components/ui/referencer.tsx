"use client"

import React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/shadcn/sheet"
import { ScrollArea } from "@/components/ui/shadcn/scroll-area"

interface ReferencerProps {
  isOpen: boolean
  onClose: () => void
  currentConversation: { title: string; id: string }
}

export const Referencer: React.FC<ReferencerProps> = ({ isOpen, onClose, currentConversation }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>References</SheetTitle>
          <SheetDescription>Manage your thesis references for "{currentConversation.title}".</SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] pr-4">
          {/* Placeholder content - to be enhanced later */}
          <div className="py-4 text-center text-muted-foreground">
            Reference management features will be implemented here.
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}