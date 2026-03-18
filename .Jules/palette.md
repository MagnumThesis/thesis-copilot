## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-10 - ARIA Labels for Icon-Only Buttons in Complex Components
**Learning:** Icon-only buttons embedded deep within complex, dynamic components (like message lists or chat histories) are frequently overlooked when adding accessibility features, compared to static forms.
**Action:** When working with or reviewing complex UI components, explicitly scan for and ensure all icon-only buttons have descriptive `aria-label` attributes for screen reader support.