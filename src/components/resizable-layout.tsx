import * as React from "react"

interface ResizableLayoutProps {
  children: React.ReactNode
}

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
