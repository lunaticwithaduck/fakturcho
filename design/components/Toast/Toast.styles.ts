import { tv } from 'tailwind-variants';

export const toastRootStyles = tv({
  base: 'relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-md',
  variants: {
    variant: {
      neutral: 'border-border bg-surface-raised',
      success: 'border-success-border bg-success-subtle',
      warning: 'border-warning-border bg-warning-subtle',
      danger: 'border-danger-border bg-danger-subtle',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

export const toastTitleStyles = tv({
  base: 'text-sm font-semibold text-text',
});

export const toastDescriptionStyles = tv({
  base: 'mt-1 text-sm text-text-muted',
});

export const toastCloseStyles = tv({
  base: 'ml-auto shrink-0 rounded-md p-1 text-text-muted transition-colors duration-(--duration-fast) ease-in-out hover:bg-surface-sunken hover:text-text',
});

export const toastViewportStyles = tv({
  base: 'fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 outline-none sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm',
});
