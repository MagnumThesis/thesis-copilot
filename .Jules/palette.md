## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-07-07 - Avoid aria-expanded for visibility toggles
**Learning:** `aria-expanded` is strictly meant for widgets that control the visibility of an expandable/collapsible layout region (like an accordion or a dropdown menu). Using it on a button that simply toggles an `<input>` type between `password` and `text` is semantically incorrect and can confuse screen readers.
**Action:** When implementing show/hide toggles that do not alter the DOM layout (like password visibility), rely solely on dynamic `aria-label`s to convey state changes. Do not use `aria-expanded`.
