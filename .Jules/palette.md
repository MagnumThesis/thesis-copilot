## 2024-05-18 - Missing ARIA labels on Icon-only Action Buttons
**Learning:** Icon-only buttons for inline editing, regenerating with AI, and canceling edits in `src/components/ui/attachment-menu.tsx` are missing `aria-label`s, only relying on visual cues or HTML title attributes which aren't fully accessible. Screen readers wouldn't know what these buttons do.
**Action:** When adding icon-only action buttons (like edit, save, cancel, regenerate), always include an explicit `aria-label` to ensure screen reader compatibility, even if a `title` attribute is present.

## 2024-05-18 - Missing ARIA labels on Icon-only Action Buttons
**Learning:** Icon-only buttons for inline editing, regenerating with AI, and canceling edits in `src/components/ui/attachment-menu.tsx` are missing `aria-label`s, only relying on visual cues or HTML title attributes which aren't fully accessible. Screen readers wouldn't know what these buttons do.
**Action:** When adding icon-only action buttons (like edit, save, cancel, regenerate), always include an explicit `aria-label` to ensure screen reader compatibility, even if a `title` attribute is present.
