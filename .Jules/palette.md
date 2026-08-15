## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-08-15 - Pattern: Missing ARIA labels in secondary info panels
**Learning:** Components that serve as secondary/detail views (like `ReferenceDetail`) often contain many icon-only utility buttons (e.g. "Copy", "Close", "External Link"). These are frequently overlooked for accessibility because they are seen as "secondary" to the main workflow, but they are crucial for full screen reader support.
**Action:** Always perform a dedicated sweep of secondary panels and dialogs for icon-only buttons to ensure they have descriptive `aria-label` attributes.
