## 2024-05-24 - Missing ARIA Labels on Remove Buttons in ReferenceForm
**Learning:** Icon-only remove buttons (like 'X' to remove an author or a tag) lack text and aria-labels, making them inaccessible to screen readers and difficult for users to determine what they do. Also, action buttons like 'Add Author' or 'Add Tag' that are just a plus icon should have clear aria labels.
**Action:** Add descriptive aria-label and title attributes to all icon-only action buttons.
