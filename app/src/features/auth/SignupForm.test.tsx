// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SignupForm } from './SignupForm';

const signUpMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@app/auth', () => ({
  signUp: { email: (...args: unknown[]) => signUpMock(...args) },
  mapAuthErrorMessage: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  signUpMock.mockClear();
});

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

  it('links to the Bulgarian login page by default', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <SignupForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Вход' })).toHaveProperty(
      'href',
      'http://localhost:3000/login',
    );
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Sign up for Fakturcho' })).toBeTruthy();
    expect(screen.getByText('Create a free account. You get 1.00 € starting credit.')).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Country')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('does not preselect Bulgaria for an English visitor', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Country').textContent).not.toContain('Bulgaria');
  });

  it('preselects the country from a valid initialCountry prop', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" initialCountry="de" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Country').textContent).toContain('Germany');
  });

  it('preselects the country from a repeated initialCountry query param', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" initialCountry={['de', 'fr']} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Country').textContent).toContain('Germany');
  });

  it('ignores an invalid initialCountry prop', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" initialCountry="zz" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Country').textContent).not.toContain('Bulgaria');
  });

  it('links to the English login page when rendered for the en route', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveProperty(
      'href',
      'http://localhost:3000/en/login',
    );
  });

  it('rejects submission without a chosen country on the en route', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <SignupForm locale="en" />
      </NextIntlClientProvider>,
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.getByText('Please select a country.')).toBeTruthy();
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
