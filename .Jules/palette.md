## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2024-06-27 - Dynamic ARIA labels for toggleable tools panel
**Learning:** Icon-only buttons that toggle states (like opening or closing a sidebar/tools panel) need dynamic `aria-label` and `title` attributes that reflect the *current* action (e.g., "Close tools panel" when open, "Open tools panel" when closed) rather than a static description.
**Action:** When implementing toggleable UI elements, use state-driven ternary operators for accessibility attributes (e.g., `aria-label={isOpen ? 'Close' : 'Open'}`) and include tooltips via `title` for visual users hovering over the icon.
