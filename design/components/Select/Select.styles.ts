import { tv } from 'tailwind-variants';

export const selectTriggerStyles = tv({
  base: 'flex w-full items-center justify-between gap-2 rounded-md border bg-surface-raised px-3.5 text-sm text-text outline-none transition-colors duration-(--duration-fast) ease-in-out data-[placeholder]:text-text-subtle focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    invalid: {
      true: 'border-danger focus:ring-danger',
      false: 'border-border focus:ring-accent',
    },
    size: {
      sm: 'h-9',
      md: 'h-11',
      lg: 'h-13',
    },
  },
  defaultVariants: {
    invalid: false,
    size: 'md',
  },
});

export const selectContentStyles = tv({
  base: 'z-50 overflow-hidden rounded-lg border border-border bg-surface-raised p-1 shadow-lg',
});

export const selectItemStyles = tv({
  base: 'relative flex cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-8 text-sm text-text outline-none data-[highlighted]:bg-surface-sunken data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
});

export type SelectTriggerStylesProps = Parameters<typeof selectTriggerStyles>[0];
