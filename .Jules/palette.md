## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-15 - Interactive clickable cards should use native buttons
**Learning:** Using `<div onClick={...}>` for clickable cards (like in `ToolsPanel`) breaks keyboard navigation and screen reader accessibility since `div`s aren't naturally focusable or interactive.
**Action:** Always wrap interactive card components in native `<button type="button">` tags (with classes like `w-full text-left` to preserve layout) instead of `div`s to ensure correct semantic accessibility and keyboard support.
