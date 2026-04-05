## 2026-04-05 - Add ARIA Labels to Filter Clear Buttons
**Learning:** Dynamic icon-only buttons for clearing filters (e.g., just rendering '×') often lack `aria-label`s, causing screen readers to misinterpret their context. They must explicitly state what filter is being cleared (e.g., 'Clear status filter').
**Action:** Always verify that dynamically conditionally rendered clear or remove icon-only buttons include explicit and descriptive `aria-label` attributes.
