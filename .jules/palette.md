## 2024-04-11 - Dynamic ARIA Labels for State-Toggling Icons
**Learning:** Icon-only buttons that toggle states (like password visibility toggles using Eye/EyeOff icons) are often missing `aria-label`s. Screen readers need these labels to change dynamically to reflect both the current state and the action the button performs, not just a static label.
**Action:** Always implement dynamic `aria-label` attributes for state-toggling icon-only buttons that reflect the current state and action (e.g., `aria-label={showPassword ? 'Hide password' : 'Show password'}`) to ensure full accessibility.
