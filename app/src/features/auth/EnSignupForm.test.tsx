// @vitest-environment jsdom
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnSignupForm } from './EnSignupForm';

vi.mock('@app/auth', () => ({
  signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
  mapAuthErrorMessage: vi.fn(),
}));

const { getSearchParams, setSearchParams } = vi.hoisted(() => {
  let params = new URLSearchParams();
  return {
    getSearchParams: () => params,
    setSearchParams: (next: URLSearchParams) => {
      params = next;
    },
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => getSearchParams(),
}));

afterEach(() => {
  cleanup();
  setSearchParams(new URLSearchParams());
});

describe('EnSignupForm', () => {
  it('preselects the country from the country search param', () => {
    setSearchParams(new URLSearchParams('country=de'));
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <EnSignupForm />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Country').textContent).toContain('Germany');
  });
});
