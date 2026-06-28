## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in animated/toggling panel components
**Learning:** Icon-only toggle buttons (like the one in `src/components/ui/tools-panel.tsx`) that change state (e.g., open/closed) need dynamic `aria-label` and `title` attributes. Otherwise, screen reader users and those relying on tooltips have no context for the button's action or current state.
**Action:** When implementing toggleable icon-only buttons, always include a dynamic `aria-label` (and preferably a `title` for visual tooltips) that reflects the action they will perform in the current state (e.g., `isOpen ? "Close" : "Open"`).
