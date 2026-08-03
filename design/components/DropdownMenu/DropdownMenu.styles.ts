import { tv } from 'tailwind-variants';

export const dropdownMenuContentStyles = tv({
  base: 'z-50 min-w-40 overflow-hidden rounded-lg border border-border bg-surface-raised p-1 shadow-lg',
});

export const dropdownMenuItemStyles = tv({
  base: 'flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-text outline-none data-[highlighted]:bg-surface-sunken data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
});

export const dropdownMenuSeparatorStyles = tv({
  base: 'my-1 h-px bg-border',
});
