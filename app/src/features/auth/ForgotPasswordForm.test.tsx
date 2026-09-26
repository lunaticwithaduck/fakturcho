// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const requestPasswordResetMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@app/auth', () => ({
  authClient: {
    requestPasswordReset: (...args: unknown[]) => requestPasswordResetMock(...args),
  },
}));

afterEach(() => {
  cleanup();
  requestPasswordResetMock.mockClear();
});

describe('ForgotPasswordForm', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ForgotPasswordForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Забравена парола' })).toBeTruthy();
    expect(screen.getByLabelText('Имейл')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изпратете връзка' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ForgotPasswordForm locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Forgot password' })).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('requests a reset with the redirect built for the current locale', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ForgotPasswordForm locale="en" />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    await screen.findByText(
      "If an account exists for this email, we've sent a password reset link.",
    );
    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: 'a@b.com',
      redirectTo: 'http://localhost:3000/en/reset-password',
    });
  });

  it('shows the same neutral message even when the request fails', async () => {
    requestPasswordResetMock.mockResolvedValueOnce({
      error: { code: 'INTERNAL_SERVER_ERROR' },
    });

    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ForgotPasswordForm />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Имейл'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Изпратете връзка' }));

    expect(
      await screen.findByText(
        'Ако съществува акаунт с този имейл, изпратихме връзка за смяна на паролата.',
      ),
    ).toBeTruthy();
  });

  it('links back to the login page', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ForgotPasswordForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Обратно към входа' })).toHaveProperty(
      'href',
      'http://localhost:3000/login',
    );
  });
});
