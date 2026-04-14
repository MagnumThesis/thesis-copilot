## 2024-05-18 - Interactive Div Accessibility
**Learning:** Found custom interactive elements (like the AudioVisualizer container div) that rely solely on `onClick` without keyboard support or ARIA roles.
**Action:** Always ensure that interactive non-button elements (`div`, `span`) receive `role="button"`, `tabIndex={0}`, an `onKeyDown` handler (for Space/Enter), and appropriate `aria-label`s to be fully accessible to screen readers and keyboard users. Added focus-visible styles for better visual feedback.
