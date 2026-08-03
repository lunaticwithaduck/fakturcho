import { tv } from 'tailwind-variants';

export const tabsListStyles = tv({
  base: 'inline-flex items-center gap-1 rounded-md bg-surface-sunken p-1',
});

export const tabsTriggerStyles = tv({
  base: 'rounded-sm px-3.5 py-1.5 text-sm font-medium text-text-muted transition-colors duration-(--duration-fast) ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-accent data-[state=active]:bg-surface-raised data-[state=active]:text-text data-[state=active]:shadow-xs',
});

export const tabsContentStyles = tv({
  base: 'mt-4 outline-none',
});
