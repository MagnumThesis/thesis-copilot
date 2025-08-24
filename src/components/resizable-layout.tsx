import * as React from "react"

interface ResizableLayoutProps {
  children: React.ReactNode
}

/**
 * A layout component that provides a resizable sidebar and a main content area.
 * The sidebar's width can be adjusted by dragging a separator.
 * @param {ResizableLayoutProps} props - The properties for the ResizableLayout component.
 * @param {React.ReactNode} props.children - The children to be rendered within the layout. Expected to be three children: sidebar, separator, and content.
 * @example
 * ```tsx
 * <ResizableLayout>
 *   <div>Sidebar Content</div>
 *   <div className="separator" />
 *   <div>Main Content</div>
 * </ResizableLayout>
 * ```
 */
export function ResizableLayout({ children }: ResizableLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = React.useState(260)
  const isDragging = React.useRef(false)

  const onMouseDown = () => {
    isDragging.current = true
    document.body.style.cursor = "col-resize"
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const newWidth = Math.min(Math.max(e.clientX, 160), 480)
    setSidebarWidth(newWidth)
  }

  const onMouseUp = () => {
    isDragging.current = false
    document.body.style.cursor = "default"
  }

  React.useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  const childrenArray = React.Children.toArray(children)

  const sidebar = childrenArray[0] ?? null
  const separator = childrenArray[1] ?? null
  const content = childrenArray[2] ?? null

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div
        style={{ width: sidebarWidth }}
        className="shrink-0 border-r bg-[#50d71e] border-l "
      >
        {sidebar}
      </div>

      <div
        onMouseDown={onMouseDown}
        className="cursor-col-resize w-[4px] bg-border hover:bg-muted transition"
      >
        {separator}
      </div>

      <div className="flex-1 overflow-hidden">
        {content}
      </div>
    </div>
  )
}
