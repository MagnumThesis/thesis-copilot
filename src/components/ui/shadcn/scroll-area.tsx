"use client"

import React from "react"
import { cn } from "@/lib/utils"

// Re-implementing ScrollArea components locally to avoid external dependency issues
// Based on typical shadcn/ui implementations which use Radix UI primitives

// --- Start of local ScrollAreaPrimitive implementation ---
// Note: This is a simplified version and might not cover all Radix UI features.
// For a full implementation, consider installing the package if permissions allow.

const ScrollAreaViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-full w-full rounded-[inherit]", className)}
    {...props}
  >
    {children}
  </div>
))
ScrollAreaViewport.displayName = "ScrollAreaViewport"

const ScrollAreaScrollbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation: "vertical" | "horizontal" }
>(({ className, orientation, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical"
        ? "h-full w-2.5 border-l border-l-transparent p-[1px]"
        : "h-2.5 border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
ScrollAreaScrollbar.displayName = "ScrollAreaScrollbar"

const ScrollAreaThumb = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex-1 rounded-full bg-border", className)}
    {...props}
  >
    {children}
  </div>
))
ScrollAreaThumb.displayName = "ScrollAreaThumb"

const ScrollAreaCorner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1", className)}
    {...props}
  >
    {children}
  </div>
))
ScrollAreaCorner.displayName = "ScrollAreaCorner"

// --- End of local ScrollAreaPrimitive implementation ---

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    orientation?: "vertical" | "horizontal"
  }
>(({ className, children, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn("overflow-hidden text-foreground", className)}
    {...props}
  >
    <ScrollAreaViewport>
      {children}
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation={orientation}>
      <ScrollAreaThumb />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </div>
))
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
