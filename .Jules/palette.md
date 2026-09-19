## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-19 - Missing ARIA labels in expandable side panels
**Learning:** Expanding side panels or toolbars that rely on a single icon-only toggle button (like `<ChevronRight>`) are completely invisible to screen reader users without an `aria-label`.
**Action:** When implementing or reviewing collapsible UI regions, ensure the toggle button has a descriptive `aria-label` explaining what region it controls (e.g., "Toggle Tools Panel").
