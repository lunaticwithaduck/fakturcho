export type NavItemLabelKey = 'documents' | 'clients' | 'catalogue' | 'billing' | 'profile';

export interface NavItem {
  href: string;
  labelKey: NavItemLabelKey;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/documents', labelKey: 'documents' },
  { href: '/clients', labelKey: 'clients' },
  { href: '/catalogue', labelKey: 'catalogue' },
  { href: '/billing', labelKey: 'billing' },
  { href: '/profile', labelKey: 'profile' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
