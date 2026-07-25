## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2024-05-18 - Missing ARIA Labels on Icon-only Action Buttons
**Learning:** Icon-only buttons used for inline actions (like edit, save, cancel in `attachment-menu.tsx`) or layout toggles (like in `tools-panel.tsx`) frequently miss `aria-label`s, creating a complete lack of context for screen reader users since they have no textual content.
**Action:** When auditing or building components with icon-only actions (especially within lists, dropdowns, or toolbars), always ensure an explicit `aria-label` or `title` is provided, and dynamically update it if the button toggles state.
