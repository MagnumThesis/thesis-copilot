## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Collapsible regions and filter controls lacking ARIA semantics
**Learning:** Collapsible trigger buttons for "Thinking" regions and "Attached" files, as well as the dynamic "×" buttons to clear active filters, lacked `aria-expanded` and `aria-label` attributes. Screen reader users would not be aware of their state or purpose without visual cues.
**Action:** Always ensure that dynamically generated buttons, particularly for collapsible content and filter clearing, have proper `aria-expanded` and `aria-label` tags to convey their exact context and state.
