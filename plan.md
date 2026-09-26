1. **Add `aria-label` to icon buttons in `src/components/app-sidebar.tsx`**
   - The buttons to "Edit title" (`Pencil` icon) and "Regenerate title with AI" (`Sparkles` icon) already have `aria-label` attributes (verified from line 246 and 258).
   - "Profile", "Settings", and "Logout" buttons in the footer have `.sr-only` spans or `aria-label`/`title`, wait, let me check:
     - Profile: `<span className="sr-only">Profile</span>`
     - Settings: `<span className="sr-only">Settings</span>`
     - Logout: `<span className="sr-only">Logout</span>`
   - Wait, they have `title` and `sr-only` text. `title` attribute is present on them. Let's look closer.

2. **Add `aria-label` to icon buttons in `src/components/ui/attachment-menu.tsx`**
   - The buttons inside the edit idea title mode (lines 370-388) have no `aria-label` (save edit, cancel edit). Wait, let's look at `attachment-menu.tsx` lines 368-389.
   - The buttons to edit/regenerate title in `attachment-menu.tsx` (lines 402-424) have `title` but no `aria-label`. Wait, `aria-label` on them is missing.

3. **Add `aria-label` to toggle Tools panel in `src/components/ui/tools-panel.tsx`**
   - The button at line 52 to toggle the panel has no `aria-label`. Screen readers would just say "button" with no text. It toggles the tools panel.

Let's verify these missing labels and pick one area to fix.
