## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-09-10 - Keyboard accessibility for custom cards
**Learning:** Using `<div onClick={...}>` for interactive card components prevents native keyboard accessibility (Tab focus and Enter/Space activation) which is a common accessibility issue.
**Action:** Replace `div` wrappers with `<button type="button">` and apply utility classes like `w-full text-left` to preserve the visual layout structure while ensuring correct semantic accessibility and focus rings.
