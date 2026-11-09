## 2024-05-15 - Icon-Only Button Tooltips
**Learning:** Icon-only buttons (like `CopyButton`) with just an `aria-label` are accessible to screen readers, but lack visual context for sighted users, leading to ambiguity. Adding an `AccessibleTooltip` solves this and provides immediate visual feedback (e.g., "Copied!") upon interaction.
**Action:** Always wrap icon-only buttons in `<AccessibleTooltip>` and utilize dynamic content for state feedback when applicable.
