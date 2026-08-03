import { tv } from 'tailwind-variants';

export const buttonStyles = tv({
  base: 'inline-flex items-center justify-center gap-2 shrink-0 rounded-md font-medium transition-colors duration-(--duration-fast) ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-accent text-text-inverse hover:bg-accent-hover active:bg-accent-active',
      secondary:
        'bg-surface-raised text-text border border-border hover:bg-surface-sunken active:bg-surface-sunken',
      ghost: 'bg-transparent text-text hover:bg-surface-sunken active:bg-surface-sunken',
      danger: 'bg-danger text-text-inverse hover:bg-danger-hover active:bg-danger-hover',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonStylesProps = Parameters<typeof buttonStyles>[0];
