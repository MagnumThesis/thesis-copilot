import * as React from "react"
import { cn } from "@/lib/utils"

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: keyof React.JSX.IntrinsicElements
}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ as: Component = "span", className, ...props }, ref) => {
    const Element = Component as React.ElementType
    return (
      <Element
        ref={ref}
        className={cn(
          "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]",
          className
        )}
        {...props}
      />
    )
  }
)

VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }
