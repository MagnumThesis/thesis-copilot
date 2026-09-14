## 2026-09-14 - Icon-only buttons lacking ARIA labels
**Learning:** Found multiple instances where icon-only buttons (like Edit, Delete, Save) rely only on the `title` attribute or lack descriptions altogether. While `title` gives a visual tooltip on hover, it's insufficient for robust screen reader accessibility.
**Action:** Always explicitly provide an `aria-label` on `<Button size="icon">` components, even if a `title` attribute is present.

## 2026-09-14 - Journaling Process
**Learning:** Found that completely overwriting the journal file `.Jules/palette.md` deletes valuable past learnings.
**Action:** When updating a journal file, always append new entries (e.g., using `cat << 'EOF' >>`) instead of overwriting (e.g., `cat << 'EOF' >`), or manually read and preserve existing content.
