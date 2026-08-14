## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## $(date +%Y-%m-%d) - Adding ARIA labels to icon-only interactive elements
**Learning:** React elements utilizing purely visual iconography via standard libraries like Lucide React (e.g. `Check`, `X`, `Pencil`) as interactive controls (buttons, toggles) lack accessible names by default, leading screen readers to ignore them or announce them unhelpfully (e.g. simply as "button").
**Action:** Always proactively review implementations of icon-only `Button` elements for corresponding `aria-label`s. Dynamically toggling controls (like an expanding/collapsing side panel) should have dynamically updating `aria-label` text (e.g., `aria-label={isOpen ? "Close panel" : "Open panel"}`) to provide accurate current-state context to users navigating via screen readers.
