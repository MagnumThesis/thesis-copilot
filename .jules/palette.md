
## 2024-05-18 - Missing ARIA Labels in Conditionally Rendered Dynamic State Icon Buttons
**Learning:** Icon-only buttons that are conditionally rendered based on UI state (e.g., toggling between default "Edit"/"Regenerate" states and active "Save"/"Cancel" edit modes) are highly prone to missing `aria-label` attributes. Developers often overlook accessibility for transient or dynamic inline editing states compared to permanent UI fixtures.
**Action:** Always audit inline editing components and ensure that each branch of a conditionally rendered icon-only button explicitly defines a context-aware `aria-label` attribute (e.g., `aria-label="Save title edit"` vs `aria-label="Edit title"`).
