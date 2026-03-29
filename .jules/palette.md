
## 2024-03-29 - Add ARIA labels to dynamic list actions
**Learning:** Icon-only buttons in dynamic arrays (like adding/removing authors and tags) are frequently missed during accessibility audits, rendering them completely inaccessible to screen readers.
**Action:** Always ensure an explicit `aria-label` is added to repetitive array actions and dialog close buttons when they consist solely of icons.
