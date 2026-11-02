# Dependency patches

## Element Plus 2.14.7

`element-plus@2.14.7.patch` fixes auto-width form labels mounted in hidden content. An unmeasurable label can return a non-numeric computed width; registering that value or removing an unregistered zero width produces `[ElForm] unexpected width` warnings.

The patch normalizes non-finite measurements to zero and deregisters only positive widths. Both the ESM and CommonJS builds are patched through pnpm's `patchedDependencies` setting. Regression coverage is in `apps/web/src/components/form-label-width.test.ts`.

When upgrading Element Plus, check the upstream implementation and remove this patch once the regression passes without it.
