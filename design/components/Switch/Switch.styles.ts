import { tv } from 'tailwind-variants';

export const switchRootStyles = tv({
  base: 'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent bg-surface-sunken transition-colors duration-(--duration-base) ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:pointer-events-none data-[state=checked]:bg-accent',
});

export const switchThumbStyles = tv({
  base: 'block size-5 translate-x-0.5 rounded-full bg-surface-raised shadow-sm transition-transform duration-(--duration-base) ease-in-out data-[state=checked]:translate-x-5',
});

export const switchLabelStyles = tv({
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
