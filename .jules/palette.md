
## 2026-03-09 - Accessible Tooltips and Labels for Removable Filter Badges
**Learning:** Icon-only remove buttons within dynamic badges (e.g., email tags, active filters) lack context for both screen reader users and sighted mouse users.
**Action:** Always include a dynamically interpolated `aria-label` (for screen readers) and `title` (for native hover tooltips) on tag/filter removal buttons using the specific item's value (e.g., `Remove ${item}`).
