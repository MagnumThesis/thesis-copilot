1. **Add `aria-label` to the "show/hide password" buttons in Login.tsx and Register.tsx.**
   - In `src/react-app/pages/Login.tsx`, find the `<button>` used to toggle password visibility.
   - Add `aria-label={showPassword ? "Hide password" : "Show password"}` to this button.
   - In `src/react-app/pages/Register.tsx`, find the `<button>` used to toggle password visibility.
   - Add `aria-label={showPassword ? "Hide password" : "Show password"}` to this button.
   - In `src/react-app/pages/Register.tsx`, find the `<button>` used to toggle confirm password visibility.
   - Add `aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}` to this button.

2. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run linter: `pnpm lint`
   - Run tests: `pnpm test`
