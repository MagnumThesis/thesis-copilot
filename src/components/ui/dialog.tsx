import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * A modal dialog component that can be used to display content over the main page.
 * This component is built on top of Radix UI's Dialog primitive.
 * 
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open Dialog</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Dialog Title</DialogTitle>
 *       <DialogDescription>Dialog description text</DialogDescription>
 *     </DialogHeader>
 *     <div>Dialog content</div>
 *     <DialogFooter>
 *       <Button>Save</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/**
 * The button that opens the dialog when clicked.
 * This component is built on top of Radix UI's Dialog.Trigger primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Trigger>} props - The props for the DialogTrigger component
 * @example
 * ```tsx
 * <DialogTrigger asChild>
 *   <Button>Open Dialog</Button>
 * </DialogTrigger>
 * ```
 */
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/**
 * The portal component that renders the dialog in a separate part of the DOM tree.
 * This component is built on top of Radix UI's Dialog.Portal primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Portal>} props - The props for the DialogPortal component
 */
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/**
 * The button that closes the dialog.
 * This component is built on top of Radix UI's Dialog.Close primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Close>} props - The props for the DialogClose component
 */
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/**
 * The overlay that appears behind the dialog to prevent interaction with the main page.
 * This component is built on top of Radix UI's Dialog.Overlay primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Overlay>} props - The props for the DialogOverlay component
 * @param {string} [props.className] - Additional CSS classes to apply to the overlay
 */
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/**
 * The main content area of the dialog.
 * This component is built on top of Radix UI's Dialog.Content primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }} props - The props for the DialogContent component
 * @param {string} [props.className] - Additional CSS classes to apply to the content
 * @param {React.ReactNode} props.children - The content to display inside the dialog
 * @param {boolean} [props.showCloseButton=true] - Whether to show the close button in the top right corner
 * @example
 * ```tsx
 * <DialogContent>
 *   <DialogHeader>
 *     <DialogTitle>Dialog Title</DialogTitle>
 *     <DialogDescription>Dialog description text</DialogDescription>
 *   </DialogHeader>
 *   <div>Dialog content</div>
 *   <DialogFooter>
 *     <Button>Save</Button>
 *   </DialogFooter>
 * </DialogContent>
 * ```
 */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * The header section of the dialog, typically containing the title and description.
 * 
 * @param {React.ComponentProps<"div">} props - The props for the DialogHeader component
 * @param {string} [props.className] - Additional CSS classes to apply to the header
 * @example
 * ```tsx
 * <DialogHeader>
 *   <DialogTitle>Dialog Title</DialogTitle>
 *   <DialogDescription>Dialog description text</DialogDescription>
 * </DialogHeader>
 * ```
 */
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

/**
 * The footer section of the dialog, typically containing action buttons.
 * 
 * @param {React.ComponentProps<"div">} props - The props for the DialogFooter component
 * @param {string} [props.className] - Additional CSS classes to apply to the footer
 * @example
 * ```tsx
 * <DialogFooter>
 *   <Button variant="outline">Cancel</Button>
 *   <Button>Save</Button>
 * </DialogFooter>
 * ```
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * The title of the dialog.
 * This component is built on top of Radix UI's Dialog.Title primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Title>} props - The props for the DialogTitle component
 * @param {string} [props.className] - Additional CSS classes to apply to the title
 * @example
 * ```tsx
 * <DialogTitle>Dialog Title</DialogTitle>
 * ```
 */
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

/**
 * The description text for the dialog.
 * This component is built on top of Radix UI's Dialog.Description primitive.
 * 
 * @param {React.ComponentProps<typeof DialogPrimitive.Description>} props - The props for the DialogDescription component
 * @param {string} [props.className] - Additional CSS classes to apply to the description
 * @example
 * ```tsx
 * <DialogDescription>This is a description of what the dialog does.</DialogDescription>
 * ```
 */
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
