## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-07-18 - Context-aware ARIA attributes on dynamic UI buttons
**Learning:** Interactive, dynamic buttons created in mapped loops (like inline-edit controls in attachment menus) must use dynamic `aria-label` and `title` attributes incorporating the specific item's data (e.g., `idea.title`) to provide clear, actionable context for screen reader users and sighted users hovering.
**Action:** When working with inline edit patterns inside lists, always apply context-aware string interpolation for accessibility attributes on icon-only buttons.
