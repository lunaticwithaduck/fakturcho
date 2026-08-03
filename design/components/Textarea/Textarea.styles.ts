import { tv } from 'tailwind-variants';

export const textareaStyles = tv({
  base: 'w-full min-w-0 resize-y rounded-md border bg-surface-raised px-3.5 py-2.5 text-sm text-text placeholder:text-text-subtle outline-none transition-colors duration-(--duration-fast) ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface',
  variants: {
    invalid: {
      true: 'border-danger focus:ring-danger',
      false: 'border-border focus:ring-accent',
    },
    disabled: {
      true: 'opacity-50 pointer-events-none bg-surface-sunken',
      false: '',
    },
  },
  defaultVariants: {
    invalid: false,
    disabled: false,
  },
});
