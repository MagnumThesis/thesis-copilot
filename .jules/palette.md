## 2024-03-24 - Dynamic Aria-Labels for State Toggles
**Learning:** Icon-only buttons that toggle states (like password visibility) often miss context-aware accessibility labeling. Screen reader users need to know both the current state and the action that will happen when clicked.
**Action:** Always implement dynamic `aria-label` attributes on state-toggling icon buttons, rather than static labels. For example, use `aria-label={showPassword ? "Hide password" : "Show password"}` instead of just `"Toggle password visibility"`.
