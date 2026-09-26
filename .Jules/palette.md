## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive context menus
**Learning:** Icon-only buttons within dynamic context menus or attachment popovers (`src/components/ui/attachment-menu.tsx`, `src/components/ui/tools-panel.tsx`) often lack accessible names, making them invisible to screen readers, even when they have visual tooltips (like `title="Edit title"`). A `title` attribute is often insufficient for robust accessibility compared to a dedicated `aria-label`.
**Action:** When creating icon-only buttons for actions like "Edit", "Regenerate", "Save", "Cancel", or toggling panels, always explicitly assign an `aria-label` that clearly describes the action, particularly in complex iterative workflows or collapsible menus.
