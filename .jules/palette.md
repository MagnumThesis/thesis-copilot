## 2024-04-25 - Dynamic ARIA labels in comparison arrays
**Learning:** Icon-only action buttons rendered inside loops across comparison cards cause accessibility issues without specific context (i.e. hearing "remove, remove, remove").
**Action:** Always assign dynamic `aria-label` attributes derived from item properties (e.g., `aria-label={\`Remove \${item.title}\`}`) to interactive elements within mapped arrays.
