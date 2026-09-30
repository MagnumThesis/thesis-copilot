## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-30 - Missing ARIA labels in mapped item lists
**Learning:** Icon-only buttons rendered inside mapped lists (like the edit, save, cancel, and regenerate buttons in the Attachment Menu) often lack `aria-label`s, rendering them inaccessible to screen readers as they do not have visible text. While `title` attributes were present, explicit `aria-label`s are necessary for consistent accessibility.
**Action:** Ensure all `size="icon"` buttons, especially those mapped over dynamic collections, have descriptive `aria-label` attributes.
