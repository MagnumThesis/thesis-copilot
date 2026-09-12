## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-12 - Missing ARIA labels in dynamic/interactive tools and attachment components
**Learning:** Icon-only buttons in interactive side-panels and menus (`src/components/ui/tools-panel.tsx`, `src/components/ui/attachment-menu.tsx`), particularly actions like "Expand/Collapse tools panel", "Save edit", "Cancel edit", "Edit title", and "Regenerate title with AI", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes. Furthermore, toggle buttons (like the tools panel toggle) need dynamic `aria-label`s reflecting their state (e.g. `isOpen ? "Collapse" : "Expand"`).
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes. For toggle buttons, ensure the `aria-label` dynamically reflects the current state to provide accurate context to screen readers.
