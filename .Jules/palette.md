## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-10-24 - Accessible Icon-Only Buttons
**Learning:** Found multiple instances of icon-only buttons lacking `aria-label` attributes across different UI components (e.g., `attachment-menu.tsx`, `tools-panel.tsx`). While visual users understand the icon (like a pencil for edit or a check for save), screen readers need explicit labels to convey the button's purpose.
**Action:** When creating or reviewing UI components, always ensure that `<Button size="icon">` (or similar icon-only interactive elements) include an explicitly defined, descriptive `aria-label` attribute.
