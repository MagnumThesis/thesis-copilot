## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-28 - Missing ARIA labels in UI menus
**Learning:** Several interactive features in the `ToolsPanel` and `AttachmentMenu` components relied heavily on icon-only buttons (`size="icon"` from Shadcn UI). These buttons execute critical workflows like saving, canceling, or regenerating AI titles, but were missing `aria-label` attributes. Without them, screen readers announce them generically as "button", completely degrading the accessibility and usability for visually impaired users.
**Action:** When implementing action menus with condensed layouts containing `size="icon"` buttons, always ensure that each button explicitly receives a clear, descriptive `aria-label` attribute indicating its function (e.g., `aria-label="Save idea title"`). Additionally, a `title` attribute is often beneficial for mouse users to provide a tooltip hover effect.
