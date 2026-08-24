## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-08-24 - Dynamic ARIA Labels for List Item Actions and Toggle Buttons
**Learning:** Icon-only buttons for actions like editing, saving, or deleting within lists lack context for screen reader users. Additionally, toggle buttons that change layout states must communicate their expanded/collapsed state dynamically to assistive technologies.
**Action:** Always provide context-specific `aria-label` and `title` attributes that incorporate the associated item's title (e.g., `Save title for ${item.title}`). For toggleable panels, use `aria-expanded={isOpen}` and dynamic labels based on the state.
