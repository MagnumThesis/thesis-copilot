## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Dynamic ARIA attributes and titles for stateful UI toggles
**Learning:** Stateful toggle buttons (like a side panel toggle) require dynamic `aria-label` and `aria-expanded` attributes, alongside a `title` for hover tooltips, to ensure their current state and action are accurately communicated to both screen reader users and mouse users.
**Action:** Always verify that collapsible or toggleable components dynamically update their accessibility attributes (e.g. `isOpen ? 'Close' : 'Open'`) rather than using static labels.
