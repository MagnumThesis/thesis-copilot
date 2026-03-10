1. **What:** Wrap `filteredItems` and `data` in `useMemo` in `AppSidebar`.
   - Update `AppSidebar` to import `useMemo` from `react`
   - Wrap the filtering logic for `filteredItems` with `useMemo(() => items.filter(...), [items, searchQuery])`
   - Wrap the `data` creation with `useMemo(() => ({ navMain: ... }), [filteredItems])`
2. **Why:** To prevent unnecessary filtering operations and object allocations on every render of `AppSidebar` (which can happen frequently if the parent component re-renders or if other local state like `isUpdating` changes). This is particularly impactful when the `items` list is large.
3. **Impact:** Improves React rendering performance by caching the filtered list and data object unless their dependencies change.
4. **Measurement:** Verify by running `npm run lint` and `npm run test -- --run` and optionally visual verification if required.
