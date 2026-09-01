## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-09-01 - Missing ARIA Attributes on Custom Collapsible Triggers
**Learning:** When using Radix UI `CollapsibleTrigger asChild` with custom `<button>` elements (like the "Thinking" and "Attached" sections in `chat-message.tsx`), accessibility attributes like `aria-expanded` and `aria-controls` are not always automatically applied or conveyed to screen readers.
**Action:** Always manually ensure that custom buttons used as collapsible triggers have `aria-expanded` reflecting their open state and `aria-controls` pointing to the ID of the `CollapsibleContent` to maintain correct screen reader behavior.
## 2026-09-01 - ARIA Roles for Custom Tab Navigations
**Learning:** In React applications, custom components styled as tabs (using simple state like `activeTab`) often lack semantic meaning, forcing screen readers to interpret them as just generic buttons.
**Action:** Always enrich custom tab implementations with the proper `role="tablist"`, `role="tab"`, and `role="tabpanel"` attributes, linking them correctly via `aria-controls` and `aria-labelledby` to restore semantic accessibility.
