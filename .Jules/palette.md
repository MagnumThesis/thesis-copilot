## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-07-23 - ARIA labels for accessible toggle buttons
**Learning:** Icon-only toggle buttons, such as the one used to open/close the Tools Panel, require dynamic `aria-label` and `aria-expanded` attributes to convey both their purpose and current state to screen reader users.
**Action:** When creating collapsible sidebars or panels with icon-only toggles, always implement state-aware `aria-label` (e.g., 'Open panel' / 'Close panel') and `aria-expanded={isOpen}` attributes.
