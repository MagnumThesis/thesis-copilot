## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-04-19 - Adding ARIA labels to icon-only form buttons
**Learning:** Icon-only buttons (like the Close "X" or Add/Remove "+/-" buttons in forms) without `aria-label`s provide no context to screen reader users, making the form inaccessible.
**Action:** Proactively add descriptive `aria-label` attributes to any icon-only `<Button>` or `<button>` elements, utilizing dynamic variables when they are inside maps (e.g. ``aria-label={`Remove tag ${tag}`}``) to ensure comprehensive accessibility.
