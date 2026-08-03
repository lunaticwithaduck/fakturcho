'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isNavItemActive, NAV_ITEMS } from './navItems';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface-raised md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'flex flex-1 items-center justify-center border-t-2 border-accent py-3 text-sm font-semibold text-accent'
                : 'flex flex-1 items-center justify-center border-t-2 border-transparent py-3 text-sm font-medium text-text-muted'
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
