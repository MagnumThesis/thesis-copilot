## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-18 - Missing ARIA labels on dynamic attachment and tool menu buttons
**Learning:** Icon-only buttons used for saving, cancelling, editing, and toggling panels (e.g., in `attachment-menu.tsx`, `tools-panel.tsx`, and `sidebar.tsx`) are missing `aria-label` attributes, relying sometimes on the `title` attribute or nothing at all. This creates a significant accessibility barrier, especially for screen readers interacting with dynamically added or collapsible UI elements.
**Action:** Consistently apply `aria-label` attributes to all icon-only buttons (`size="icon"`), even if a `title` attribute is present, to ensure proper announcement by assistive technologies.
