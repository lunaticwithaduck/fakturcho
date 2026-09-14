// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@app/auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@app/features/shell/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div data-shell>{children}</div>,
}));

import AppGroupLayout from './layout';

describe('AppGroupLayout', () => {
  it('renders children inside RequireAuth and AppShell', () => {
    render(<AppGroupLayout>{<span>page content</span>}</AppGroupLayout>);

    expect(screen.getByText('page content')).toBeTruthy();
  });
});
