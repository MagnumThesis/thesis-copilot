## 2024-04-29 - Missing ARIA Labels on Dynamically Mapped Interactive Elements
**Learning:** When rendering interactive elements dynamically in loops (such as mapping over tags to create removal buttons), it's easy to overlook that generic static labels are insufficient. Screen readers need specific context.
**Action:** Always assign dynamic `aria-label` attributes derived from the item properties (e.g., `aria-label={"Remove tag " + tag}`) to give specific context to screen readers, rather than generic static labels or no labels at all for icon-only buttons.
