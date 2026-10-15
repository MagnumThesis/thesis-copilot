## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-15 - Semantic buttons over clickable divs
**Learning:** Using `div` elements with `onClick` handlers for interactive cards (like the tools in the ToolsPanel) breaks native keyboard accessibility (tabbing, Enter/Space activation) and semantic HTML for screen readers.
**Action:** Always use `<button>` elements for interactive items and apply necessary CSS resets (e.g., `w-full text-left`) to maintain the desired visual design while preserving accessibility.
