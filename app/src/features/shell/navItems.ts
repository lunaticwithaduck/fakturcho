export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/documents', label: 'Документи' },
  { href: '/clients', label: 'Клиенти' },
  { href: '/catalogue', label: 'Каталог' },
  { href: '/profile', label: 'Профил' },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
