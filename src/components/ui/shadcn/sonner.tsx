"use client"

import React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      richColors
      toastOptions={{
        style: {
          background: "white",
          color: "var(--popover-foreground)",
          border: "1px solid var(--border)",
        },
        classNames: {
          closeButton: "!left-auto !right-1 !top-1 !transform-none !border !border-gray-200 !bg-white !text-gray-500 hover:!bg-gray-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
