## 2024-04-02 - Missing aria-labels on badge removal buttons
**Learning:** Dynamic lists using badges with icon-only close buttons (like 'X' or '×') frequently lack `aria-label` attributes across components (e.g., Reference Form authors/tags, Search Result Sharing emails, Concern List filters). This makes it impossible for screen reader users to understand what item they are removing.
**Action:** Always ensure an explicit `aria-label` (e.g., `aria-label="Remove [item name]"`) is added to any icon-only button used for removal or clearing within dynamic arrays and badges.
