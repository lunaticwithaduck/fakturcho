import { tv } from 'tailwind-variants';

export const dialogOverlayStyles = tv({
  base: 'fixed inset-0 z-50 bg-overlay',
});

export const dialogPositionerStyles = tv({
  base: 'fixed inset-0 z-50 flex items-center justify-center p-4',
});

export const dialogContentStyles = tv({
  base: 'relative w-full max-w-md rounded-xl border border-border bg-surface-raised p-6 shadow-lg outline-none',
});

export const dialogCloseStyles = tv({
  base: 'absolute right-4 top-4 rounded-md p-1 text-text-muted transition-colors duration-(--duration-fast) ease-in-out hover:bg-surface-sunken hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
});

export const dialogTitleStyles = tv({
  base: 'text-lg font-semibold text-text',
});

export const dialogDescriptionStyles = tv({
  base: 'mt-1.5 text-sm text-text-muted',
});
