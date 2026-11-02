## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-11-02 - Accessible tooltips for icon-only actions
**Learning:** Native `title` attributes on icon-only buttons (`size="icon"`) are visually inconsistent and sometimes inadequate for screen readers when nested inside `<Link>` elements. Using a custom `<AccessibleTooltip>` combined with `<Button asChild>` and explicit `aria-label` attributes ensures consistent styling, better keyboard focus feedback, and robust screen reader support without needing visually hidden spans (`sr-only`) that duplicate text.
**Action:** When creating icon-only buttons, especially in sidebars or toolbars, prefer wrapping them in `<AccessibleTooltip>` and providing an explicit `aria-label` rather than relying on `title` or `sr-only` spans.
