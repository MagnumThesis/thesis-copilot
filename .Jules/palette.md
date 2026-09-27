## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-27 - Explicit ARIA labels on icon buttons
**Learning:** Even when `title` attributes or `<span className="sr-only">` child elements are present, icon-only buttons (`<Button size="icon">`) should always have an explicit `aria-label` attribute. Some screen readers handle `sr-only` content inside interactive elements inconsistently, and `aria-label` provides the most robust and universally supported accessibility experience for these UI patterns.
**Action:** Always verify that icon-only buttons (`size="icon"`) explicitly define an `aria-label` attribute, regardless of other visually hidden text or native tooltips.
