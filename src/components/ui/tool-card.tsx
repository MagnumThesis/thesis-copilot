"use client"

import React from "react"
import { cn } from "@/lib/utils" // Added this import

interface ToolCardProps {
  title: string
  description: string // Added description prop
  className?: string
  children?: React.ReactNode
}

export const ToolCard: React.FC<ToolCardProps> = ({ 
  title,
  description, // Destructure description prop
  className,
  children 
}) => {
  return (
    <div className={cn(
      "p-4 border rounded-lg shadow-sm bg-card text-card-foreground",
      className
    )}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-sm text-muted-foreground">
        {description} {/* Display the description */}
      </div>
    </div>
  )
}
