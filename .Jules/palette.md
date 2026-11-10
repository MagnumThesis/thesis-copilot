## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2024-11-10 - ARIA labels for dynamic remove buttons
**Learning:** When generating interactive elements in a loop, like a list of authors or tags where each item has a "Remove" button, a static `aria-label="Remove"` or `aria-label="Remove author"` is insufficient for screen reader users to distinguish between the buttons.
**Action:** Always use template literals to construct dynamic, context-specific `aria-label` attributes based on the current loop item, such as ``aria-label={`Remove author ${author.firstName}`}``, providing clear identification for each action.
