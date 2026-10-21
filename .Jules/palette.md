## 2026-03-09 - ARIA labels for dynamic elements
**Learning:** For interactive UI elements created in loops (like star ratings), dynamic `aria-label`s (e.g. `aria-label={`Rate ${star} out of 5 stars`}`) provide critical context for screen readers that static text cannot.
**Action:** Always verify that interactive map-generated components have clear, context-aware `aria-label` attributes.

## 2026-03-09 - Missing ARIA labels in dynamic/interactive chat components
**Learning:** Icon-only buttons in the core Chat component (`src/components/ui/chat.tsx`), particularly actions like "Thumbs up", "Thumbs down", and "Scroll to bottom", were missing `aria-label` attributes. Screen reader users would have no context for what these buttons do since they lack text nodes.
**Action:** When implementing new features or components with interactive icon-only buttons (`size="icon"`), proactively add descriptive `aria-label` attributes.

## 2026-10-21 - ARIA labels for dynamic and interactive overlay components
**Learning:** Icon-only buttons within secondary interactive layers like drop-down attachment menus (`src/components/ui/attachment-menu.tsx`) and expandable side panels (`src/components/ui/tools-panel.tsx`) are often overlooked for accessibility. Specifically, elements like "Save edit", "Cancel edit", "Edit title", and "Regenerate title with AI", as well as toggle buttons for floating panels, frequently lack text nodes and `aria-label`s, rendering them completely opaque to screen reader users navigating these complex interactive states.
**Action:** Always verify that interactive buttons within dropdowns, popovers, sheets, and dynamic overlays have clear, context-aware `aria-label` attributes, especially when they represent critical CRUD actions or state toggles using only icons.
