// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { sessionMock } = vi.hoisted(() => ({ sessionMock: vi.fn() }));

vi.mock('@app/auth/hooks', () => ({ useAuthSession: sessionMock }));

import { BackToAppLink } from './BackToAppLink';

afterEach(cleanup);

describe('BackToAppLink', () => {
  it('links a signed-in visitor back to the documents page', () => {
    sessionMock.mockReturnValue({ session: { user: { id: 'u1' } }, isPending: false, error: null });
    render(<BackToAppLink label="Back to the app" />);
    expect(screen.getByRole('link', { name: '← Back to the app' }).getAttribute('href')).toBe(
      '/documents',
    );
  });

  it('renders nothing for a guest', () => {
    sessionMock.mockReturnValue({ session: null, isPending: false, error: null });
    const { container } = render(<BackToAppLink label="Back to the app" />);
    expect(container.innerHTML).toBe('');
  });
});
