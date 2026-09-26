// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage, { metadata } from './page';

vi.mock('@app/features/auth/ResetPasswordForm', () => ({
  ResetPasswordForm: ({
    token,
    invalidToken,
  }: {
    token: string | null;
    invalidToken?: boolean;
  }) => <div data-testid="reset-password-form">{JSON.stringify({ token, invalidToken })}</div>,
}));

afterEach(() => {
  cleanup();
});

describe('ResetPasswordPage metadata', () => {
  it('carries the Bulgarian canonical and every published-locale alternate, noindex', () => {
    expect(metadata.title).toBe('Нова парола');
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates?.canonical).toBe('/reset-password');
    expect(metadata.alternates?.languages).toEqual({
      bg: '/reset-password',
      en: '/en/reset-password',
      de: '/de/reset-password',
      fr: '/fr/reset-password',
      it: '/it/reset-password',
      pl: '/pl/reset-password',
      ro: '/ro/reset-password',
      'x-default': '/reset-password',
    });
  });
});

describe('ResetPasswordPage', () => {
  it('passes the token and error query params through to the form', async () => {
    const element = await ResetPasswordPage({
      searchParams: Promise.resolve({ token: 'abc', error: 'INVALID_TOKEN' }),
    });
    render(element);

    expect(screen.getByTestId('reset-password-form').textContent).toBe(
      JSON.stringify({ token: 'abc', invalidToken: true }),
    );
  });

  it('passes a null token when none is present', async () => {
    const element = await ResetPasswordPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByTestId('reset-password-form').textContent).toBe(
      JSON.stringify({ token: null, invalidToken: false }),
    );
  });
});
