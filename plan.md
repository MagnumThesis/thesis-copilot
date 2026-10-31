1. **Import `AccessibleTooltip` in `src/components/app-sidebar.tsx`:**
   - Import it from `@/components/ui/accessible-tooltip`.
2. **Update the user action buttons in the SidebarFooter:**
   - Wrap the Profile `<Link>` with `<AccessibleTooltip content="Profile">`. Remove `title="Profile"`. Give the `<Button>` `aria-label="Profile"`.
   - Wrap the Settings `<Link>` with `<AccessibleTooltip content="Settings">`. Remove `title="Settings"`. Give the `<Button>` `aria-label="Settings"`.
   - Wrap the Logout `<Button>` with `<AccessibleTooltip content="Logout">`. Remove `title="Logout"`. Give the `<Button>` `aria-label="Logout"`.
3. **Verify functionality:**
   - Run type checks `pnpm tsc --noEmit`.
   - Run lint checks `pnpm lint`.
   - Run tests `pnpm test`.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
5. **Submit the change.**
