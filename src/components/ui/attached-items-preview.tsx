"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Lightbulb, 
  FileText, 
  AlertTriangle, 
  BookOpen, 
  X 
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/shadcn/badge"
import { Button } from "@/components/ui/shadcn/button"
import { AttachedItem } from "./attachment-menu"

interface AttachedItemsPreviewProps {
  items: AttachedItem[]
  onRemove: (id: string, type: string) => void
  className?: string
}

/**
 * @component AttachedItemsPreview
 * @description Displays a preview of attached items (ideas, content, concerns, references)
 * with the ability to remove individual items.
 */
export function AttachedItemsPreview({
  items,
  onRemove,
  className,
}: AttachedItemsPreviewProps) {
  if (items.length === 0) return null

  const getIcon = (type: AttachedItem["type"]) => {
    switch (type) {
      case "idea":
        return <Lightbulb className="h-3 w-3 text-yellow-500" />
      case "content":
        return <FileText className="h-3 w-3 text-blue-500" />
      case "concern":
        return <AlertTriangle className="h-3 w-3 text-orange-500" />
      case "reference":
        return <BookOpen className="h-3 w-3 text-green-500" />
    }
  }

  const getTypeLabel = (type: AttachedItem["type"]) => {
    switch (type) {
      case "idea":
        return "Idea"
      case "content":
        return "Content"
      case "concern":
        return "Concern"
      case "reference":
        return "Reference"
    }
  }

  const getBorderColor = (type: AttachedItem["type"]) => {
    switch (type) {
      case "idea":
        return "border-yellow-500/30 bg-yellow-500/5"
      case "content":
        return "border-blue-500/30 bg-blue-500/5"
      case "concern":
        return "border-orange-500/30 bg-orange-500/5"
      case "reference":
        return "border-green-500/30 bg-green-500/5"
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={`${item.type}-${item.id}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md border text-xs",
              getBorderColor(item.type)
            )}
          >
            {getIcon(item.type)}
            <span className="max-w-[120px] truncate font-medium">
              {item.title}
            </span>
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              {getTypeLabel(item.type)}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => onRemove(item.id, item.type)}
              aria-label={`Remove ${item.title}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
