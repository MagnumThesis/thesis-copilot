## 2025-03-08 - Dynamic ARIA labels for state-toggling icon-only buttons
**Learning:** State-toggling icon-only buttons (like password visibility toggles) require dynamic aria-labels that reflect the current state and action to ensure accessibility for screen readers.
**Action:** Implement dynamic aria-labels (e.g., aria-label={state ? 'Hide' : 'Show'}) for all state-toggling icon-only buttons.
