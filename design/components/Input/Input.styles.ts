import { tv } from 'tailwind-variants';

export const inputWrapperStyles = tv({
  base: 'flex items-center gap-2 rounded-md border bg-surface-raised transition-colors duration-(--duration-fast) ease-in-out focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-surface',
  variants: {
    invalid: {
      true: 'border-danger focus-within:ring-danger',
      false: 'border-border focus-within:ring-accent',
    },
    size: {
      sm: 'h-9 px-3',
      md: 'h-11 px-3.5',
      lg: 'h-13 px-4',
    },
    disabled: {
      true: 'opacity-50 pointer-events-none bg-surface-sunken',
      false: '',
    },
  },
  defaultVariants: {
    invalid: false,
    size: 'md',
    disabled: false,
  },
});

export const inputFieldStyles = tv({
  base: 'w-full min-w-0 bg-transparent text-text placeholder:text-text-subtle outline-none',
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type InputWrapperStylesProps = Parameters<typeof inputWrapperStyles>[0];
