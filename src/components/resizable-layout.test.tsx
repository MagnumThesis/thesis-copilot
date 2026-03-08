import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ResizableLayout } from "./resizable-layout"
import React from "react"

describe("ResizableLayout", () => {
  beforeEach(() => {
    // Reset body style before each test
    document.body.style.cursor = "default"
  })

  it("should render children correctly", () => {
    render(
      <ResizableLayout>
        <div data-testid="sidebar">Sidebar</div>
        <div data-testid="separator">Separator</div>
        <div data-testid="content">Content</div>
      </ResizableLayout>
    )

    expect(screen.getByTestId("sidebar")).toBeInTheDocument()
    expect(screen.getByTestId("separator")).toBeInTheDocument()
    expect(screen.getByTestId("content")).toBeInTheDocument()

    // Check initial width
    const sidebarContainer = screen.getByTestId("sidebar").parentElement
    expect(sidebarContainer).toHaveStyle({ width: "260px" })
  })

  it("should update cursor and sidebar width when dragging", () => {
    render(
      <ResizableLayout>
        <div data-testid="sidebar">Sidebar</div>
        <div data-testid="separator">Separator</div>
        <div data-testid="content">Content</div>
      </ResizableLayout>
    )

    const separatorContainer = screen.getByTestId("separator").parentElement!
    const sidebarContainer = screen.getByTestId("sidebar").parentElement!

    // Initial cursor
    expect(document.body.style.cursor).toBe("default")

    // Mouse down on separator
    fireEvent.mouseDown(separatorContainer)
    expect(document.body.style.cursor).toBe("col-resize")

    // Mouse move to resize
    fireEvent.mouseMove(window, { clientX: 300 })
    expect(sidebarContainer).toHaveStyle({ width: "300px" })

    // Mouse up to stop dragging
    fireEvent.mouseUp(window)
    expect(document.body.style.cursor).toBe("default")

    // Mouse move after mouse up should not resize
    fireEvent.mouseMove(window, { clientX: 350 })
    expect(sidebarContainer).toHaveStyle({ width: "300px" }) // still 300px
  })

  it("should respect min and max constraints (160px - 480px)", () => {
    render(
      <ResizableLayout>
        <div data-testid="sidebar">Sidebar</div>
        <div data-testid="separator">Separator</div>
        <div data-testid="content">Content</div>
      </ResizableLayout>
    )

    const separatorContainer = screen.getByTestId("separator").parentElement!
    const sidebarContainer = screen.getByTestId("sidebar").parentElement!

    // Mouse down
    fireEvent.mouseDown(separatorContainer)

    // Move below min
    fireEvent.mouseMove(window, { clientX: 100 })
    expect(sidebarContainer).toHaveStyle({ width: "160px" })

    // Move above max
    fireEvent.mouseMove(window, { clientX: 600 })
    expect(sidebarContainer).toHaveStyle({ width: "480px" })

    // Mouse up
    fireEvent.mouseUp(window)
  })

  it("should clean up event listeners on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    const { unmount } = render(
      <ResizableLayout>
        <div>Sidebar</div>
        <div>Separator</div>
        <div>Content</div>
      </ResizableLayout>
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))

    removeEventListenerSpy.mockRestore()
  })
})
