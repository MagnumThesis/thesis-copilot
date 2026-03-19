## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-19 - ARIA labels for chat interface icon buttons
**Learning:** Shadcn `<Button size="icon">` components frequently omit accessible names, severely impacting accessibility for critical app features like rating and scrolling in chat interfaces where only a Lucide icon is present.
**Action:** Always append explicit `aria-label`s to any icon-only button to ensure they are properly announced by screen readers.
