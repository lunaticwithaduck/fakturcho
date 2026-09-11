// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from './RequireAuth';

const replaceMock = vi.fn();
const { pathnameMock, sessionMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
  sessionMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: pathnameMock,
}));

vi.mock('./hooks', () => ({
  useAuthSession: sessionMock,
}));

afterEach(() => {
  cleanup();
  replaceMock.mockClear();
  pathnameMock.mockReset();
  sessionMock.mockReset();
});

describe('RequireAuth', () => {
  it('redirects a logged-out visitor on a bare path to /login', () => {
    pathnameMock.mockReturnValue('/documents');
    sessionMock.mockReturnValue({ session: null, isPending: false });

    render(
      <RequireAuth>
        <span>secret</span>
      </RequireAuth>,
    );

    expect(replaceMock).toHaveBeenCalledWith('/login');
  });

  it('redirects a logged-out visitor coming from an /en path to /en/login', () => {
    pathnameMock.mockReturnValue('/en/documents');
    sessionMock.mockReturnValue({ session: null, isPending: false });

    render(
      <RequireAuth>
        <span>secret</span>
      </RequireAuth>,
    );

    expect(replaceMock).toHaveBeenCalledWith('/en/login');
  });

  it('renders children once a session resolves, without redirecting', () => {
    pathnameMock.mockReturnValue('/en/documents');
    sessionMock.mockReturnValue({ session: { id: '1' }, isPending: false });

    render(
      <RequireAuth>
        <span>secret</span>
      </RequireAuth>,
    );

    expect(screen.getByText('secret')).toBeTruthy();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
