import { tv } from 'tailwind-variants';

export const radioGroupRootStyles = tv({
  base: 'flex flex-col gap-2.5',
});

export const radioItemStyles = tv({
  base: 'flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong transition-colors duration-(--duration-fast) ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none data-[state=checked]:border-accent',
});

export const radioLabelStyles = tv({
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
