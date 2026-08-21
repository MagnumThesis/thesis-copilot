## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2025-08-21 - Accessible dynamic badge filters
**Learning:** Icon-only remove buttons (`×`) inside dynamic filter badges are often overlooked for accessibility since the context is obvious visually (next to the label). However, screen readers read these simply as "multiplication x" or "times".
**Action:** Always add dynamic `aria-label` attributes to icon-only buttons inside badges, including the specific context of what is being removed (e.g. `aria-label="Remove status filter Open"`).
