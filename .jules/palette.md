## 2026-04-26 - Dynamic aria-labels for Icon-Only Buttons in Lists
**Learning:** Icon-only buttons rendered in loops (e.g., mapping over ideas) lack built-in semantic context and can become ambiguous to screen reader users if given static `aria-label`s. Using dynamic labels that incorporate item properties (like `${idea.title}`) ensures each button's specific function is accurately communicated.
**Action:** Always provide dynamic, context-specific `aria-label`s for icon-only interactive elements rendered in loops across the application.
