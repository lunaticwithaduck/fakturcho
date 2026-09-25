// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useGetIssuerProfileQueryMock, useRouterMock, usePathnameMock, signOutMock } = vi.hoisted(
  () => ({
    useGetIssuerProfileQueryMock: vi.fn(),
    useRouterMock: vi.fn(),
    usePathnameMock: vi.fn(),
    signOutMock: vi.fn(),
  }),
);

vi.mock('@app/api', () => ({ useGetIssuerProfileQuery: useGetIssuerProfileQueryMock }));
vi.mock('@app/auth', () => ({ signOut: signOutMock }));
vi.mock('next/navigation', () => ({
  useRouter: useRouterMock,
  usePathname: usePathnameMock,
}));
vi.mock('next/image', () => ({
  default: ({ src, alt, priority: _priority, ...rest }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...rest} />
  ),
}));

import { Sidebar } from './Sidebar';

afterEach(() => {
  cleanup();
  useGetIssuerProfileQueryMock.mockReset();
  useRouterMock.mockReset();
  usePathnameMock.mockReset();
  signOutMock.mockReset();
});

function renderSidebar() {
  usePathnameMock.mockReturnValue('/documents');
  useRouterMock.mockReturnValue({ replace: vi.fn() });
  useGetIssuerProfileQueryMock.mockReturnValue({ data: undefined });
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <Sidebar />
    </NextIntlClientProvider>,
  );
}

describe('Sidebar', () => {
  it('links to the in-app help page', () => {
    renderSidebar();
    const link = screen.getByRole('link', { name: bgMessages.shell.helpLink });
    expect(link.getAttribute('href')).toBe('/help');
  });
});
