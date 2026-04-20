## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-03-09 - Accessible interactive elements in tools panel
**Learning:** Icon-only buttons (like the sidebar toggle in `ToolsPanel`) and clickable `div` wrappers acting as buttons (like tool cards) lacked fundamental accessibility attributes. Screen reader users would have no context for the toggle, and keyboard users could not navigate or activate the tool cards.
**Action:** Always provide dynamic `aria-label`s for stateful icon-only buttons (e.g., "Open/Close panel") and ensure custom interactive elements like clickable `div`s implement full keyboard accessibility (`role="button"`, `tabIndex={0}`, and `onKeyDown` handlers).
