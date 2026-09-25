import type { LucideIcon } from '@design/components';
import { CreditCard, FileText, Package, Settings, Users } from '@design/components';

export type NavItemLabelKey = 'documents' | 'clients' | 'catalogue' | 'billing' | 'profile';

export interface NavItem {
  href: string;
  labelKey: NavItemLabelKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/documents', labelKey: 'documents', icon: FileText },
  { href: '/clients', labelKey: 'clients', icon: Users },
  { href: '/catalogue', labelKey: 'catalogue', icon: Package },
  { href: '/billing', labelKey: 'billing', icon: CreditCard },
  { href: '/profile', labelKey: 'profile', icon: Settings },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
