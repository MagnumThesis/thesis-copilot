## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-13 - Custom Tab Accessibility Pattern
**Learning:** Custom tab navigation components built without Radix UI in this design system (e.g., in CitationFormatter) often lack structural ARIA properties, which breaks screen reader navigation between tablists and their corresponding panels.
**Action:** When implementing custom tab navigation components in React (i.e., not using a library like Radix UI), ensure semantic accessibility by manually applying `role="tablist"` to the container, `role="tab"` to the tab buttons, and `role="tabpanel"` to the content areas, correctly linking them with `aria-controls` and `aria-labelledby`.
