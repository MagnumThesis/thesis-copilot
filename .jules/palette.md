## 2025-05-14 - Improve accessibility and focus states for filter removal badges
**Learning:** Filter badges with standalone removal buttons (the internal "×" icons) frequently lack proper labeling and hover states, leading to poor keyboard navigation and screen reader experiences.
**Action:** Always add dynamic `aria-label`, `title`, and robust `focus-visible` ring styling to inline badge removal buttons to ensure clarity and navigability for all users.
