## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-09-20 - Missing ARIA labels in toggle and action panels
**Learning:** Icon-only buttons used for toggling side panels (like the Tools Panel) or performing inline actions (like Edit/Regenerate in attachment lists) often rely solely on visual cues (icons) or `title` attributes. This provides an inaccessible experience for screen reader users who cannot perceive these visual elements.
**Action:** When implementing sidebars, sliding panels, or inline action buttons that only use icons, always explicitly set an `aria-label`. For toggle buttons, ensure the label dynamically reflects the action that will occur (e.g., "Close" vs "Open").
