## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2024-03-25 - Accessibility for Icon-only Close Buttons
**Learning:** Found an accessibility issue pattern specific to this app: many `Button` components consisting only of an `<X />` icon (used for closing dialogs/panels/forms) lack an `aria-label` attribute, rendering them inaccessible or poorly described by screen readers.
**Action:** When implementing new panels, dialogs, or forms that require a close button, always ensure an explicit `aria-label` (e.g., `aria-label="Close dialog"`) is provided when using `<Button variant="ghost" size="icon">` or similar icon-only patterns.
