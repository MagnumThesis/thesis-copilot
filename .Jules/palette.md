## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-26 - Missing ARIA labels for modal/panel close buttons
**Learning:** Across multiple UI components, particularly those acting as modals, dialogs, or panels (like `reference-detail`, `search-result-export`, etc.), the icon-only `<Button variant="ghost"><X /></Button>` pattern for closing was consistently used without an `aria-label`. This makes the core 'close' action inaccessible to screen readers.
**Action:** Always add an explicit `aria-label="Close"` to icon-only close buttons, especially those using `variant="ghost"` or `size="icon"`.
