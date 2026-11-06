## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2023-10-27 - Icon-only buttons lacking accessible labels
**Learning:** Native `button` elements used exclusively with icon components (e.g., `<Eye />`) are frequently missing `aria-label` and `title` attributes across the application, making them entirely inaccessible to screen reader users (who only hear "button").
**Action:** Always proactively search for `<button>` elements containing only an icon (like Lucide React icons) and ensure they have a descriptive `aria-label` for screen readers and a `title` attribute for mouse users.
