"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * A provider component for tooltips that allows configuration of tooltip behavior.
 * This component is built on top of Radix UI's Tooltip.Provider primitive.
 * 
 * @param {React.ComponentProps<typeof TooltipPrimitive.Provider>} props - The props for the TooltipProvider component
 * @param {number} [props.delayDuration=0] - The duration from when the pointer enters the trigger until the tooltip opens
 * @param {React.ReactNode} props.children - The content to display inside the provider
 * 
 * @example
 * ```tsx
 * <TooltipProvider delayDuration={300}>
 *   <Tooltip>
 *     <TooltipTrigger>Hover me</TooltipTrigger>
 *     <TooltipContent>
 *       <p>This is a tooltip</p>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 * ```
 */
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

/**
 * A tooltip component that displays additional information when hovering or focusing on a trigger element.
 * This component is built on top of Radix UI's Tooltip.Root primitive.
 * 
 * @param {React.ComponentProps<typeof TooltipPrimitive.Root>} props - The props for the Tooltip component
 * @param {React.ReactNode} props.children - The content to display inside the tooltip
 * 
 * @example
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger>Hover me</TooltipTrigger>
 *   <TooltipContent>
 *     <p>This is a tooltip</p>
 *   </TooltipContent>
 * </Tooltip>
 * ```
 */
function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

/**
 * The trigger element that opens the tooltip when hovered or focused.
 * This component is built on top of Radix UI's Tooltip.Trigger primitive.
 * 
 * @param {React.ComponentProps<typeof TooltipPrimitive.Trigger>} props - The props for the TooltipTrigger component
 * @param {React.ReactNode} props.children - The content to display inside the trigger
 * 
 * @example
 * ```tsx
 * <TooltipTrigger>Hover me</TooltipTrigger>
 * ```
 */
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * The content of the tooltip that displays the additional information.
 * This component is built on top of Radix UI's Tooltip.Content primitive.
 * 
 * @param {React.ComponentProps<typeof TooltipPrimitive.Content>} props - The props for the TooltipContent component
 * @param {string} [props.className] - Additional CSS classes to apply to the tooltip content
 * @param {number} [props.sideOffset=0] - The distance in pixels from the trigger element
 * @param {React.ReactNode} props.children - The content to display inside the tooltip
 * 
 * @example
 * ```tsx
 * <TooltipContent>
 *   <p>This is a tooltip</p>
 * </TooltipContent>
 * ```
 */
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
