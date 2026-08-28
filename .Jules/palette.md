## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-08-28 - Missing ARIA labels in dynamic/interactive attachment menu components
**Learning:** Icon-only buttons within list items of complex dynamic menus (e.g., `src/components/ui/attachment-menu.tsx`), such as "Edit title" and "Regenerate title with AI", need explicit `aria-label`s. Screen reader users would have no context for these actions since they lack text nodes, even if they have native `title` attributes.
**Action:** When implementing new list-item features with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes to ensure they are accessible.
