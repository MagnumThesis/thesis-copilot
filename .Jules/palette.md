## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-08-30 - Keyboard Accessibility for Interactive Cards
**Learning:** Using generic `div onClick` elements for clickable card components prevents keyboard users from navigating to them via Tab and activating them with Enter/Space. Additionally, missing focus states (`focus-visible`) removes crucial visual feedback for keyboard navigation.
**Action:** Always wrap interactive, card-like components that act as buttons in native `<button type="button">` tags. Apply utility classes (e.g., `w-full text-left`) to maintain the block layout, and include `focus-visible` styles to ensure clear keyboard accessibility.

## 2026-08-30 - Component Style Overrides
**Learning:** Overriding component classes (e.g. `bg-transparent`, `border-transparent`) from parent wrappers to create hover effects can strip child components of their structural CSS and cause rendering regressions (collapsing layouts).
**Action:** When adding hover states or focus rings to clickable card components, apply the interaction styles entirely to the wrapping `<button>` element rather than trying to override the child card's inherent styles.
