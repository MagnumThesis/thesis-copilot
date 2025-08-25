import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

/**
 * A label component that associates with form controls.
 * This component is built on top of Radix UI's Label primitive.
 * 
 * @param {React.ComponentProps<typeof LabelPrimitive.Root>} props - The props for the Label component
 * @param {string} [props.className] - Additional CSS classes to apply to the label
 * @param {React.ReactNode} props.children - The content to display inside the label
 * @param {string} [props.htmlFor] - The id of the form element the label is associated with
 * 
 * @example
 * ```tsx
 * <Label htmlFor="email">Email</Label>
 * <Input type="email" id="email" />
 * ```
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
