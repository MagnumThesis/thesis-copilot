## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-09-07 - Missing ARIA labels in nested menu components
**Learning:** Icon-only buttons deep within nested menus or list items (like the idea item actions in `AttachmentMenu` and the toggle in `ToolsPanel`) often lack `aria-label` attributes because they use generic icons (Pencil, Sparkles, Check, X) that lack screen reader context.
**Action:** When implementing iterative lists or nested toggles with icon-only actions, ensure every individual button includes a descriptive `aria-label` to provide context for screen readers.
