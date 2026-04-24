
## 2024-05-24 - Missing ARIA labels in nested dialogs
**Learning:** Icon-only action buttons within complex nested dialogs (like the Idea Selector in the attachment menu) frequently miss `aria-label` attributes even when they have visual tooltips (using the `title` attribute), making them inaccessible to screen readers.
**Action:** Always check for missing `aria-label` attributes on `<Button size="icon">` components, specifically when they are deeply nested in list items or dialog components.
