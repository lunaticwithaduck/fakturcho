import { tv } from 'tailwind-variants';

export const emptyStateStyles = tv({
  slots: {
    root: 'flex flex-col items-center justify-center gap-1.5 px-4 py-12 text-center',
    icon: 'mb-3 size-10 text-text-subtle',
    title: 'text-base font-semibold text-text',
    description: 'max-w-sm text-sm text-text-muted',
    action: 'mt-4',
  },
});
