import { cn } from "@/lib/utils"

/**
 * A skeleton component for displaying loading states.
 * 
 * @param {React.ComponentProps<"div">} props - The props for the Skeleton component
 * @param {string} [props.className] - Additional CSS classes to apply to the skeleton
 * @param {React.ReactNode} props.children - The content to display inside the skeleton
 * 
 * @example
 * ```tsx
 * // Basic skeleton
 * <Skeleton className="h-4 w-32" />
 * 
 * // Skeleton with custom height and width
 * <Skeleton className="h-8 w-64" />
 * 
 * // Skeleton with rounded corners
 * <Skeleton className="h-16 w-16 rounded-full" />
 * ```
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
