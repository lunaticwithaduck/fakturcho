// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

vi.mock('@app/auth', () => ({
  signIn: { email: vi.fn() },
  mapAuthErrorMessage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(cleanup);

describe('LoginForm', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <LoginForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Вход във Фактурчо' })).toBeTruthy();
    expect(screen.getByText('Въведете имейл и парола, за да продължите.')).toBeTruthy();
    expect(screen.getByLabelText('Имейл')).toBeTruthy();
    expect(screen.getByLabelText('Парола')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Вход' })).toBeTruthy();
    expect(screen.getByText('Нямате акаунт?')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Регистрирайте се' })).toBeTruthy();
  });

  it('links to the Bulgarian signup page by default', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <LoginForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Регистрирайте се' })).toHaveProperty(
      'href',
      'http://localhost:3000/signup',
    );
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LoginForm locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Log in to Fakturcho' })).toBeTruthy();
    expect(screen.getByText('Enter your email and password to continue.')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('links to the English signup page when rendered for the en route', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <LoginForm locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveProperty(
      'href',
      'http://localhost:3000/en/signup',
    );
  });
});
