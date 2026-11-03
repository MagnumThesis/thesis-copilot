## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## $(date +%Y-%m-%d) - Adding aria-labels to icon-only buttons
**Learning:** Icon-only buttons (like eye icons for password toggling) are a very common accessibility issue in React codebases. Without `aria-label`, screen readers only announce them generically (e.g., "button") which is confusing for users.
**Action:** Always verify if a button has text content. If it only contains an icon component (like `lucide-react` icons), explicitly provide a descriptive, dynamic `aria-label` based on state (e.g., "Show password" vs "Hide password").
