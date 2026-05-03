## 2024-05-24 - Accessible Close Buttons in Feedback Components
**Learning:** Icon-only close buttons (using an "X" or similar icon) lack built-in semantic meaning. This issue was found in the search result feedback components, which makes them inaccessible to screen readers and confusing for sighted users without hover context.
**Action:** Always provide explicit `aria-label` (for screen readers) and `title` (for native tooltips) to any icon-only action button, especially for ubiquitous actions like "Close".
