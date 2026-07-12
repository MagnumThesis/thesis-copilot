## 2024-07-12 - Added dynamic aria-label and aria-expanded to Tools Panel toggle button
**Learning:** Found an accessibility issue pattern in the app's components where icon-only toggle buttons for sliding panels lacked `aria-label` and `aria-expanded` attributes, making it difficult for screen readers to understand the button's purpose and state.
**Action:** Always add dynamic `aria-label`, `title`, and `aria-expanded` attributes to icon-only buttons that toggle UI elements to ensure state is clearly communicated to assistive technologies.
