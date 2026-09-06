1. **Identify the UX issue**: In `src/components/ui/concern-list.tsx`, there are native `<button>` elements used as clear buttons inside filter badges (the "×" to clear a filter). These buttons are missing `aria-label`s, which is an accessibility issue because screen readers will just read "times" or "multiplication sign" or nothing for the `×` character, instead of explaining what the button does.

2. **Fix the issue**: Add descriptive `aria-label` attributes to these three clear buttons:
   - Status clear button: `aria-label="Clear status filter"`
   - Category clear button: `aria-label="Clear category filter"`
   - Severity clear button: `aria-label="Clear severity filter"`

3. **Verify the change**: Run tests (`pnpm test`) and linting (`pnpm lint`).
4. **Complete pre-commit steps**: Run pre-commit instructions.
5. **Submit the PR**: Submit the PR as the Palette persona.
