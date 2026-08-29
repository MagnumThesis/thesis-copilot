## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-08-29 - Missing aria-labels on title-only icon buttons
**Learning:** React elements with only `title` attributes aren't always reliably announced by screen readers as accessible names. When building icon-only buttons (like Bookmark, View, Compare, Share actions in search results), developers frequently rely solely on `title` for visual tooltips but forget `aria-label`.
**Action:** When implementing icon-only controls, always duplicate or map the string meant for the tooltip into the `aria-label` attribute to ensure native screen reader accessibility.
