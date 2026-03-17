## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-17 - Missing ARIA labels in Shadcn UI components
**Learning:** Found a pattern across the application where Shadcn `<Button size="icon">` components frequently omit `aria-label`s, rendering icon-only buttons completely inaccessible to screen reader users (e.g., chat thumbs up/down, sidebar toggle, tool panel toggle, attachment menu actions).
**Action:** When working with Shadcn UI or similar design systems, always ensure that icon-only `Button` elements include descriptive `aria-label` attributes to explicitly indicate their function.
