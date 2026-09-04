## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-09-04 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Icon-only buttons used for inline actions (like editing or regenerating text) in complex components frequently lack proper ARIA labels, rendering them inaccessible to screen readers. Relying solely on a `title` attribute is often insufficient for robust accessibility.
**Action:** Always verify and enforce that any button containing only an icon (e.g., `size="icon"` buttons in Shadcn UI) explicitly includes an `aria-label` attribute describing its function, even if a `title` attribute is present.
