## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-07-06 - Tools panel toggle button missing ARIA attributes
**Learning:** The tools panel toggle in `src/components/ui/tools-panel.tsx` is an icon-only button lacking context for screen readers. Dynamic `aria-label` and `aria-expanded` are necessary for screen readers to understand state, while `title` is helpful for sighted users.
**Action:** When implementing collapsible/toggle panels using icon-only buttons, ensure to add dynamic `aria-label`, `aria-expanded`, and `title` attributes.
