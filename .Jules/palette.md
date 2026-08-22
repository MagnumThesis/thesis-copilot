## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2024-08-22 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons lacking `aria-label` attributes are completely invisible and un-actionable for screen reader users, breaking core accessibility. When an icon toggles state (e.g., open/close), the `aria-label` must dynamically reflect that state to provide accurate context.
**Action:** Always provide descriptive `aria-label`s for icon-only buttons (`size="icon"` in Shadcn UI). For stateful toggles, dynamically adjust the text (e.g., `isOpen ? "Close" : "Open"`).
