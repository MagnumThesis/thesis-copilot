## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Dynamic ARIA labels for toggleable icon-only buttons
**Learning:** Icon-only toggle buttons (like a collapsible panel trigger) need dynamic `aria-label` and `title` attributes that reflect the active state (e.g., `isOpen ? 'Close' : 'Open'`), rather than a static label. This ensures screen reader users understand the current state and the action the button will perform.
**Action:** Always apply state-dependent labels (and corresponding native tooltips) to toggleable icon buttons.
