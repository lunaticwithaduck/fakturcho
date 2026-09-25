'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isNavItemActive, NAV_ITEMS } from './navItems';

export function BottomNav() {
  const t = useTranslations('shell');
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface-raised md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={
              active
                ? 'flex flex-1 flex-col items-center justify-center gap-1 border-t-2 border-accent py-2.5 text-xs font-semibold text-accent'
                : 'flex flex-1 flex-col items-center justify-center gap-1 border-t-2 border-transparent py-2.5 text-xs font-medium text-text-muted'
            }
          >
            <Icon className="size-5" aria-hidden />
            {t(`navItems.${item.labelKey}`)}
          </Link>
        );
      })}
    </nav>
  );
}
