## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-26 - Missing ARIA labels in nested action menus
**Learning:** Icon-only buttons used in inline edit states or nested actions (like the Edit/Save/Cancel/Regenerate actions within `AttachmentMenu` dropdowns) frequently miss accessibility checks because they aren't part of primary top-level navigation.
**Action:** Always scrutinize nested dropdowns, list item actions, and temporary UI states (like editing modes) for `size="icon"` `<Button>` components to ensure they have descriptive `aria-label`s.
