## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2024-10-24 - Dynamic labels for floating state toggles
**Learning:** Icon-only floating toggle buttons (like side panel toggles) are completely invisible to screen readers without ARIA labels, and users without screen readers rely on hover titles to understand their function. Simply adding a static label is insufficient when the button's action changes based on state (e.g., from "Open" to "Close").
**Action:** Always ensure icon-only toggle buttons have both `aria-label` and `title` attributes that dynamically reflect the active state, and use `aria-expanded` when toggling layout sections.
