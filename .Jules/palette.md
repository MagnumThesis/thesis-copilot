## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-04 - ARIA labels for functional UI buttons
**Learning:** Icon-only buttons used for essential actions (like "Save edit", "Cancel edit", "Edit title", and "Regenerate title with AI" in `attachment-menu.tsx`, and the open/close toggle in `tools-panel.tsx`) often lack text nodes, leaving screen reader users without context.
**Action:** Always provide explicit, descriptive `aria-label` attributes to `size="icon"` buttons to ensure keyboard and screen reader accessibility, even if a `title` attribute is present.
