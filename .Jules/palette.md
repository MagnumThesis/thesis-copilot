## 2024-05-18 - Added ARIA labels to chat icon buttons
**Learning:** Found multiple icon-only `Button` elements in the `Chat` component without `aria-label` attributes (Thumbs Up, Thumbs Down, and Scroll Down), making them inaccessible to screen readers.
**Action:** When using icon-only buttons (`size="icon"` in Shadcn UI) always remember to add an `aria-label` so their purpose is announced correctly by assistive technology.
