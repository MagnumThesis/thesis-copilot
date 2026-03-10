## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.
## 2024-03-10 - Icon-Only Button Accessibility Pattern
**Learning:** Icon-only buttons (like thumbs up/down, scroll to bottom) in the chat interface were consistently missing `aria-label`s, which is a common accessibility trap in chat UIs where screen real estate is tight. While `CopyButton` correctly handles this internally, raw Shadcn `<Button>` components wrapping Lucide icons need explicit labels to be announced correctly by screen readers.
**Action:** Always check any `<Button size="icon">` usages across the codebase for missing `aria-label`s, especially in dynamic lists or dense UIs like chat messages.
