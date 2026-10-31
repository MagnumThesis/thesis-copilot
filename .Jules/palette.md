## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.
## 2026-10-31 - Redundant title and sr-only in icon buttons
**Learning:** Adding `aria-label` to an icon-only button is best practice, but if it already contains a `<span className="sr-only">`, that span becomes redundant for screen readers since `aria-label` overrides the inner text for the accessible name computation. Furthermore, native `title` attributes on wrapper elements like `<Link>` or the `<Button>` itself can create visually confusing, double tooltips when combined with custom tooltip components like `<AccessibleTooltip>`.
**Action:** When migrating standard icon-only buttons to use `<AccessibleTooltip>` and `aria-label`, explicitly remove both the native `title` attributes from parent/wrapper elements and any child `<span className="sr-only">` text to keep the DOM clean and prevent overlapping tooltip behaviors.
