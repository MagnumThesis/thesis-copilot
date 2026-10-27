## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-10-27 - Icon-only buttons lacking accessible names
**Learning:** Found an icon-only `<Button size="icon">` (the tools panel toggle) missing an `aria-label`, meaning screen readers cannot announce its purpose, creating a significant accessibility barrier.
**Action:** Always verify that every `size="icon"` button explicitly defines an `aria-label` attribute describing its function or state, especially for toggles where the label should dynamically reflect the current state (e.g., "Open" vs. "Close").
