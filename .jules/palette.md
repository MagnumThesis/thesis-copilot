## 2024-05-08 - Icon-only buttons lack inherent semantics
**Learning:** React components (especially those using mapping functions for tags/authors/filters) that use icon-only buttons (like Lucide `X`) inherently lack descriptive context for screen readers when removed from literal text flow.
**Action:** Always provide explicit `aria-label` (for screen readers) and `title` (for native tooltips) derived dynamically from the item properties being mapped.
