// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResetPasswordForm } from './ResetPasswordForm';

const resetPasswordMock = vi.fn().mockResolvedValue({ error: null });
const pushMock = vi.fn();

vi.mock('@app/auth', async () => {
  const actual = await vi.importActual<typeof import('@app/auth')>('@app/auth');
  return {
    authClient: { resetPassword: (...args: unknown[]) => resetPasswordMock(...args) },
    mapAuthErrorMessage: actual.mapAuthErrorMessage,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  resetPasswordMock.mockClear();
  resetPasswordMock.mockResolvedValue({ error: null });
  pushMock.mockClear();
});

function fillAndSubmit(newPassword: string, confirmPassword: string, submitLabel: string) {
  fireEvent.change(screen.getByLabelText(/^(New password|Нова парола)$/), {
    target: { value: newPassword },
  });
  fireEvent.change(screen.getByLabelText(/(Confirm new password|Потвърдете новата парола)/), {
    target: { value: confirmPassword },
  });
  fireEvent.click(screen.getByRole('button', { name: submitLabel }));
}

describe('ResetPasswordForm', () => {
  it('renders the Bulgarian copy unchanged for a valid token', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ResetPasswordForm token="a-token" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Нова парола' })).toBeTruthy();
    expect(screen.getByLabelText('Нова парола')).toBeTruthy();
    expect(screen.getByLabelText('Потвърдете новата парола')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Запазете новата парола' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResetPasswordForm locale="en" token="a-token" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Reset password' })).toBeTruthy();
    expect(screen.getByLabelText('New password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm new password')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('shows the invalid-link state when there is no token', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResetPasswordForm locale="en" token={null} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Invalid link' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveProperty(
      'href',
      'http://localhost:3000/en/forgot-password',
    );
    expect(screen.queryByLabelText('New password')).toBeNull();
  });

  it('shows the invalid-link state when the token was rejected before the page loaded', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ResetPasswordForm token="expired-token" invalidToken />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Невалидна връзка' })).toBeTruthy();
  });

  it('rejects a new password shorter than 8 characters without calling the API', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResetPasswordForm locale="en" token="a-token" />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('short', 'short', 'Save new password');

    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match the new password', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResetPasswordForm locale="en" token="a-token" />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('new-password-1', 'new-password-2', 'Save new password');

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it('submits the new password with the token and redirects to login on success', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResetPasswordForm locale="en" token="a-token" />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('new-password-1', 'new-password-1', 'Save new password');

    expect(resetPasswordMock).toHaveBeenCalledWith({
      newPassword: 'new-password-1',
      token: 'a-token',
    });
    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/en/login?resetSuccess=1');
    });
  });

  it('maps an expired token error to a translated message', async () => {
    resetPasswordMock.mockResolvedValueOnce({ error: { code: 'INVALID_TOKEN' } });

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ResetPasswordForm locale="en" token="a-token" />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('new-password-1', 'new-password-1', 'Save new password');

    expect(await screen.findByText('This link is invalid or has expired.')).toBeTruthy();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
