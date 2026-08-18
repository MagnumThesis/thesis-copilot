## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2024-08-18 - Add dynamic accessible names to badge removal buttons
**Learning:** Icon-only remove buttons inside interactive lists (like authors, tags, and emails) are completely inaccessible to screen readers. By using a generic screen-reader name like `aria-label="Remove"` instead of a dynamic context-aware name like `aria-label="Remove author John Doe"`, screen reader users hear duplicate non-descriptive actions without understanding what item they are acting upon. Furthermore, modifying the `aria-label` requires updating any associated React Testing Library queries (e.g., `screen.getAllByRole('button', { name: '' })`) to prevent failing unit tests.
**Action:** When adding or auditing icon-only buttons nested within mapped components (like Badges), always synthesize the current item context into dynamic `aria-label` and `title` attributes. Before committing the accessibility improvement, search the codebase for tests querying the element and update the regex matchers accordingly.
