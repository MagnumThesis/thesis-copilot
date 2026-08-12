## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2024-05-24 - Dynamic Context in List Item Action Buttons
**Learning:** Icon-only buttons within lists (like save/edit/cancel/regenerate) often lack dynamic context for screen readers. Using a generic `title="Edit title"` fails to convey which specific item is being interacted with.
**Action:** Always interpolate the associated item's name or title into `aria-label` and `title` attributes for list item actions (e.g., `aria-label={"Edit title for " + idea.title}`).
