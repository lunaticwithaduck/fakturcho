// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignupForm } from './SignupForm';

vi.mock('@app/auth', () => ({
  signUp: { email: vi.fn() },
  mapAuthErrorMessage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(cleanup);

describe('SignupForm', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SignupForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Регистрация във Фактурчо' })).toBeTruthy();
    expect(
      screen.getByText('Създайте безплатен акаунт. Получавате 1,00 € начален кредит.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Име')).toBeTruthy();
    expect(screen.getByLabelText('Имейл')).toBeTruthy();
    expect(screen.getByLabelText('Парола')).toBeTruthy();
    expect(screen.getByLabelText('Държава')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Регистрация' })).toBeTruthy();
    expect(screen.getByText('Вече имате акаунт?')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Вход' })).toBeTruthy();
  });

  it('defaults the country selection to Bulgaria', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SignupForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Държава').textContent).toContain('България');
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Sign up for Fakturcho' })).toBeTruthy();
    expect(screen.getByText('Create a free account. You get 1,00 € starting credit.')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Country')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
