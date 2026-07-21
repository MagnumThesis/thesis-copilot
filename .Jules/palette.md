## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-07-21 - Dynamic state mapping for accessibility
**Learning:** When using state-driven UI like collapsible sidebars or panels (e.g., ToolsPanel), dynamic `aria-label`, `title`, and `aria-expanded` attributes are necessary. Static labels fail to inform screen reader users of the current expanded/collapsed state.
**Action:** When implementing toggles for panels or menus, ensure `aria-expanded` reflects the open state, and `aria-label`/`title` dynamically describe the action (e.g., 'Open panel' vs 'Close panel').
