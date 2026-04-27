## 2026-04-27 - Add dynamic ARIA labels to mapped items
**Learning:** When rendering interactive elements dynamically in loops (such as mapping over authors or tags), ensure accessibility by assigning dynamic aria-label attributes derived from the item properties to give specific context to screen readers, rather than generic static labels.
**Action:** Always derive the aria-label and title from the mapped item properties when rendering icon-only buttons in a loop.
