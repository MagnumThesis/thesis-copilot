## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-20 - Enhanced accessibility for icon-only navigation buttons with AccessibleTooltips
**Learning:** Icon-only navigation buttons in the sidebar were relying on native `title` attributes and visually hidden text (`sr-only`), but lacked explicit `aria-label` attributes directly on the `<Button>` elements. This causes inconsistent screen reader experiences. Furthermore, native `title` tooltips appear slowly and cannot be styled.
**Action:** When creating icon-only action buttons or navigation links, wrap them in an `<AccessibleTooltip>` for better visual feedback, and ensure the interactive `<Button>` element itself has an explicit `aria-label` attribute.
