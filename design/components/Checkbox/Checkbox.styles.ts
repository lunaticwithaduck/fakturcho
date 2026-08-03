import { tv } from 'tailwind-variants';

export const checkboxRootStyles = tv({
  base: 'flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors duration-(--duration-fast) ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none data-[state=checked]:bg-accent data-[state=checked]:border-accent',
  variants: {
    invalid: {
      true: 'border-danger',
      false: 'border-border-strong',
    },
  },
  defaultVariants: {
    invalid: false,
  },
});

export const checkboxLabelStyles = tv({
  base: 'inline-flex items-center gap-2.5 text-sm text-text',
  variants: {
    disabled: {
      true: 'opacity-50 pointer-events-none',
      false: 'cursor-pointer',
    },
  },
  defaultVariants: {
    disabled: false,
  },
});
