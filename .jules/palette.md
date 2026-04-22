## 2024-05-20 - Dynamic ARIA Labels in Lists
**Learning:** When rendering interactive elements dynamically in loops (such as mapping over authors or tags), ensure accessibility by assigning dynamic `aria-label` attributes derived from the item properties to give specific context to screen readers, rather than generic static labels.
**Action:** Always interpolate item names or specific identifiers into `aria-label` props inside `.map()` functions for list items.
