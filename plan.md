1. **Analyze**: The `CopyButton` component in `src/components/ui/copy-button.tsx` is an icon-only button without a tooltip. Wrapping it with `AccessibleTooltip` will improve the UX by providing visual context ("Copy to clipboard") and feedback ("Copied!").
2. **Modify**: Edit `src/components/ui/copy-button.tsx` to:
   - Import `AccessibleTooltip` from `@/components/ui/accessible-tooltip`.
   - Wrap the returned `Button` with `<AccessibleTooltip content={isCopied ? "Copied!" : "Copy to clipboard"}>`.
3. **Verify**: Run `pnpm tsc --noEmit` and `pnpm lint` to ensure no type or lint errors are introduced.
4. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
