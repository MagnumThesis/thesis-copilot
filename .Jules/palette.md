## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-17 - Missing ARIA attributes on interactive panels
**Learning:** Collapsible side panels (like ToolsPanel) with icon-only toggle buttons often lack structural ARIA attributes. Without `aria-expanded` and `aria-controls` explicitly linking the button to the panel's `id`, screen reader users cannot perceive the state of the panel or understand the relationship between the toggle button and the content area.
**Action:** Always ensure that toggle buttons for interactive panels include `aria-label`, `aria-expanded`, and `aria-controls`, and that the target panel element has a corresponding `id`.
