## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-25 - Duplicate ARIA attributes and missing tooltips on icon buttons
**Learning:** Icon-only buttons (like thumbs up/down and scroll down in Chat) often duplicate the `aria-label` attribute (e.g. specifying it twice on the `<Button>`) which is invalid HTML and can confuse screen readers. Moreover, relying solely on `aria-label` provides no visual feedback for mouse users on hover.
**Action:** When adding or fixing accessibility on icon-only buttons, verify there are no duplicate `aria-label` attributes. Wrap the button in a tooltip component (e.g., `<AccessibleTooltip>`) passing the text as `content` to serve both screen readers (via internal aria attributes) and mouse users visually.
