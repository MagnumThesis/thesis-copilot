import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

/**
 * @function useToast
 * @description A hook that provides a simplified interface for displaying toast notifications.
 * It wraps the `sonner` library's toast functionality.
 * @returns {{toast: (props: ToastProps) => void}}
 * - `toast`: A function to display a toast notification.
 */
export const useToast = () => {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
      })
    } else {
      sonnerToast.success(title || "Success", {
        description,
      })
    }
  }

  return { toast }
}