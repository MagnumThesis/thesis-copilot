"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "../../../lib/utils"

/**
 * A separator component that visually separates content.
 * This component is built on top of Radix UI's Separator primitive.
 * 
 * @param {React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>} props - The props for the Separator component
 * @param {string} [props.className] - Additional CSS classes to apply to the separator
 * @param {"horizontal" | "vertical"} [props.orientation="horizontal"] - The orientation of the separator
 * @param {boolean} [props.decorative=true] - Whether the separator is decorative or semantic
 * 
 * @example
 * ```tsx
 * // Horizontal separator
 * <Separator />
 * 
 * // Vertical separator
 * <Separator orientation="vertical" />
 * 
 * // With custom className
 * <Separator className="bg-red-500" />
 * ```
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
