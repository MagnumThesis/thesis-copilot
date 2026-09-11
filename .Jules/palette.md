## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-09-11 - Adding ARIA labels to inline editing icon buttons
**Learning:** Icon-only buttons used for inline editing actions (like Save, Cancel, Edit, AI Generate) within complex component menus are often overlooked for accessibility because visual context seems sufficient, but they pose significant navigation barriers for screen readers without proper `aria-label` attributes.
**Action:** Always ensure that every icon-only `Button` component, particularly those representing secondary actions in list items or dropdowns, is explicitly given an `aria-label` describing its function.
