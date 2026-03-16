## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Accessible Icon Buttons in Chat Component
**Learning:** Icon-only buttons in complex components like `Chat` often lack descriptive `aria-label` attributes, which makes them inaccessible for screen-reader users and impacts overall usability.
**Action:** Proactively identify and add descriptive `aria-label` attributes to all icon-only buttons to enhance accessibility.
