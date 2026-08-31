## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-08-31 - Divs as interactive elements in structural panels
**Learning:** Found interactive cards in structural panels (e.g. Tools Panel) using `<div onClick>` which completely breaks keyboard navigation for users relying on Tab key. Applying standard `<button type="button">` with `w-full text-left` classes perfectly preserves visual structure while resolving the accessibility anti-pattern.
**Action:** When working on generic clickable areas or "cards" that are functionally buttons, always wrap them in native buttons instead of divs and use structural classes to maintain layout. Ensure `focus-visible` states are added for visual keyboard feedback.
