import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A customizable input component with various style options.
 * 
 * @param {React.ComponentProps<"input">} props - The props for the Input component
 * @param {string} [props.className] - Additional CSS classes to apply to the input
 * @param {string} [props.type] - The type of input (e.g., "text", "email", "password")
 * @param {string} [props.placeholder] - Placeholder text for the input
 * @param {string} [props.value] - The value of the input
 * @param {function} [props.onChange] - Change handler for the input
 * @param {boolean} [props.disabled] - Whether the input is disabled
 * @param {string} [props.id] - The id of the input
 * @param {string} [props.name] - The name of the input
 * 
 * @example
 * ```tsx
 * // Basic text input
 * <Input type="text" placeholder="Enter your name" />
 * 
 * // Email input
 * <Input type="email" placeholder="Enter your email" />
 * 
 * // Password input
 * <Input type="password" placeholder="Enter your password" />
 * 
 * // Disabled input
 * <Input type="text" placeholder="Disabled input" disabled />
 * ```
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
