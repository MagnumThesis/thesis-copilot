import * as React from "react"
import { cn } from "../../../lib/utils"

/**
 * A flexible container component for grouping related content and actions.
 * Cards can contain headers, footers, and various types of content.
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the Card component
 * @param {string} [props.className] - Additional CSS classes to apply to the card
 * @param {React.ReactNode} props.children - The content to display inside the card
 * 
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card Content</p>
 *   </CardContent>
 *   <CardFooter>
 *     <p>Card Footer</p>
 *   </CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * A container for the card's header section, typically containing the title and description.
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the CardHeader component
 * @param {string} [props.className] - Additional CSS classes to apply to the card header
 * @param {React.ReactNode} props.children - The content to display inside the card header
 * 
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>Card Title</CardTitle>
 *   <CardDescription>Card Description</CardDescription>
 * </CardHeader>
 * ```
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * The title element for the card, typically used within CardHeader.
 * 
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - The props for the CardTitle component
 * @param {string} [props.className] - Additional CSS classes to apply to the card title
 * @param {React.ReactNode} props.children - The content to display as the card title
 * 
 * @example
 * ```tsx
 * <CardTitle>Card Title</CardTitle>
 * ```
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * A description element for the card, typically used within CardHeader to provide additional context.
 * 
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - The props for the CardDescription component
 * @param {string} [props.className] - Additional CSS classes to apply to the card description
 * @param {React.ReactNode} props.children - The content to display as the card description
 * 
 * @example
 * ```tsx
 * <CardDescription>Card Description</CardDescription>
 * ```
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * The main content area of the card.
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the CardContent component
 * @param {string} [props.className] - Additional CSS classes to apply to the card content
 * @param {React.ReactNode} props.children - The content to display inside the card content area
 * 
 * @example
 * ```tsx
 * <CardContent>
 *   <p>Card Content</p>
 * </CardContent>
 * ```
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * A container for the card's footer section, typically containing action buttons or additional information.
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - The props for the CardFooter component
 * @param {string} [props.className] - Additional CSS classes to apply to the card footer
 * @param {React.ReactNode} props.children - The content to display inside the card footer
 * 
 * @example
 * ```tsx
 * <CardFooter>
 *   <Button>Save</Button>
 * </CardFooter>
 * ```
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
