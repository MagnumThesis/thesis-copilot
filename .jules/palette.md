
## 2024-04-10 - Dynamic ARIA labels for state-toggling icon buttons
**Learning:** Icon-only buttons that toggle state (like password visibility toggles using Eye/EyeOff icons) frequently lack ARIA labels. When they do have them, static labels are insufficient. Screen readers need dynamic labels that reflect the current state to properly understand the action they will perform.
**Action:** Always implement dynamic `aria-label` attributes that use a ternary operator to reflect the current state (e.g., `aria-label={showPassword ? 'Hide password' : 'Show password'}`) for state-toggling icon buttons, rather than just static labels.
