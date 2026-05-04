## 2024-05-20 - Dynamic ARIA labels for interactive elements in arrays
**Learning:** When rendering interactive elements dynamically in loops (such as mapping over authors or tags), screen readers need specific context to distinguish between identical actions. A generic static label like "Remove" is insufficient when there are multiple remove buttons.
**Action:** Always assign dynamic `aria-label` attributes derived from the item properties (e.g., `aria-label={"Remove tag " + tag}`) to give specific context to screen readers.
