import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@/components/ui/visually-hidden"

/**
 * A modal dialog that slides in from the edge of the screen.
 * This component is built on top of Radix UI's Dialog primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Root>} props - The props for the Sheet component
 * @param {boolean} [props.open] - Whether the sheet is open
 * @param {function} [props.onOpenChange] - Callback function when the sheet's open state changes
 * @param {React.ReactNode} props.children - The content to display inside the sheet
 * 
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger>Open Sheet</SheetTrigger>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Sheet Title</SheetTitle>
 *       <SheetDescription>Sheet description text</SheetDescription>
 *     </SheetHeader>
 *     <div>Sheet content</div>
 *     <SheetFooter>
 *       <Button>Save</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 */
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

/**
 * The button that opens the sheet when clicked.
 * This component is built on top of Radix UI's Dialog.Trigger primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Trigger>} props - The props for the SheetTrigger component
 * @param {React.ReactNode} props.children - The content to display inside the trigger
 * 
 * @example
 * ```tsx
 * <SheetTrigger>Open Sheet</SheetTrigger>
 * ```
 */
function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

/**
 * The button that closes the sheet.
 * This component is built on top of Radix UI's Dialog.Close primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Close>} props - The props for the SheetClose component
 * @param {React.ReactNode} props.children - The content to display inside the close button
 * 
 * @example
 * ```tsx
 * <SheetClose>Close</SheetClose>
 * ```
 */
function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

/**
 * The portal component that renders the sheet in a separate part of the DOM tree.
 * This component is built on top of Radix UI's Dialog.Portal primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Portal>} props - The props for the SheetPortal component
 * @param {React.ReactNode} props.children - The content to display inside the portal
 */
function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/**
 * The overlay that appears behind the sheet to prevent interaction with the main page.
 * This component is built on top of Radix UI's Dialog.Overlay primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Overlay>} props - The props for the SheetOverlay component
 * @param {string} [props.className] - Additional CSS classes to apply to the overlay
 */
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * The main content area of the sheet.
 * This component is built on top of Radix UI's Dialog.Content primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }} props - The props for the SheetContent component
 * @param {string} [props.className] - Additional CSS classes to apply to the content
 * @param {React.ReactNode} props.children - The content to display inside the sheet
 * @param {"top" | "right" | "bottom" | "left"} [props.side="right"] - The side of the screen from which the sheet slides in
 * 
 * @example
 * ```tsx
 * <SheetContent>
 *   <SheetHeader>
 *     <SheetTitle>Sheet Title</SheetTitle>
 *     <SheetDescription>Sheet description text</SheetDescription>
 *   </SheetHeader>
 *   <div>Sheet content</div>
 *   <SheetFooter>
 *     <Button>Save</Button>
 *   </SheetFooter>
 * </SheetContent>
 * ```
 */
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        <VisuallyHidden>
          <SheetPrimitive.Title>Sheet</SheetPrimitive.Title>
        </VisuallyHidden>
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

/**
 * The header section of the sheet, typically containing the title and description.
 * 
 * @param {React.ComponentProps<"div">} props - The props for the SheetHeader component
 * @param {string} [props.className] - Additional CSS classes to apply to the header
 * @param {React.ReactNode} props.children - The content to display inside the header
 * 
 * @example
 * ```tsx
 * <SheetHeader>
 *   <SheetTitle>Sheet Title</SheetTitle>
 *   <SheetDescription>Sheet description text</SheetDescription>
 * </SheetHeader>
 * ```
 */
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

/**
 * The footer section of the sheet, typically containing action buttons.
 * 
 * @param {React.ComponentProps<"div">} props - The props for the SheetFooter component
 * @param {string} [props.className] - Additional CSS classes to apply to the footer
 * @param {React.ReactNode} props.children - The content to display inside the footer
 * 
 * @example
 * ```tsx
 * <SheetFooter>
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Save</Button>
 * </SheetFooter>
 * ```
 */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

/**
 * The title of the sheet.
 * This component is built on top of Radix UI's Dialog.Title primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Title>} props - The props for the SheetTitle component
 * @param {string} [props.className] - Additional CSS classes to apply to the title
 * @param {React.ReactNode} props.children - The content to display as the sheet title
 * 
 * @example
 * ```tsx
 * <SheetTitle>Sheet Title</SheetTitle>
 * ```
 */
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

/**
 * The description text for the sheet.
 * This component is built on top of Radix UI's Dialog.Description primitive.
 * 
 * @param {React.ComponentProps<typeof SheetPrimitive.Description>} props - The props for the SheetDescription component
 * @param {string} [props.className] - Additional CSS classes to apply to the description
 * @param {React.ReactNode} props.children - The content to display as the sheet description
 * 
 * @example
 * ```tsx
 * <SheetDescription>This is a description of what the sheet does.</SheetDescription>
 * ```
 */
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
