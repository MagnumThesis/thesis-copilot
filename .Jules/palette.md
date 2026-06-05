## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in Badge remove buttons and Collapsibles
**Learning:** Icon-only remove buttons (`X` or `×`) inside Badges and filter tags (like in `reference-form.tsx` or `concern-list.tsx`) frequently lack `aria-label` attributes. Additionally, custom CollapsibleTrigger buttons often omit dynamic `aria-label`s reflecting their open/closed state.
**Action:** Always ensure that inline "remove" or "close" buttons have `aria-label="Remove [item]"` and that custom toggle buttons have dynamic `aria-label`s like `aria-label={isOpen ? "Collapse..." : "Expand..."}`.
