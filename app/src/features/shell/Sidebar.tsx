'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import brandIcon from './brand-icon.png';
import { isNavItemActive, NAV_ITEMS } from './navItems';
import { SignOutButton } from './SignOutButton';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface-raised px-4 py-6 md:flex">
      <div className="flex items-center gap-2 px-2">
        <Image src={brandIcon} alt="" className="h-7 w-7" />
        <p className="text-lg font-bold text-text">Фактурчо</p>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'flex items-center gap-3 rounded-md bg-accent-subtle px-3 py-2 text-sm font-medium text-accent'
                  : 'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-sunken hover:text-text'
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <SignOutButton className="justify-start" />
    </aside>
  );
}
