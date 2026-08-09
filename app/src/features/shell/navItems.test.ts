import { describe, expect, it } from 'vitest';
import { isNavItemActive, NAV_ITEMS } from './navItems';

describe('NAV_ITEMS', () => {
  it('links the billing page', () => {
    expect(NAV_ITEMS).toContainEqual({ href: '/billing', label: 'Билинг' });
  });
});

describe('isNavItemActive', () => {
  it('matches the exact route', () => {
    expect(isNavItemActive('/documents', '/documents')).toBe(true);
  });

  it('matches a nested route', () => {
    expect(isNavItemActive('/documents/abc123', '/documents')).toBe(true);
    expect(isNavItemActive('/documents/new', '/documents')).toBe(true);
  });

  it('does not match a different top-level route', () => {
    expect(isNavItemActive('/clients', '/documents')).toBe(false);
  });

  it('does not match a route that merely shares a prefix', () => {
    expect(isNavItemActive('/documentsomething', '/documents')).toBe(false);
  });
});
