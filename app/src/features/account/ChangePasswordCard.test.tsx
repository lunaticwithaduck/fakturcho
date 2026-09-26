// @vitest-environment jsdom
import * as designComponents from '@design/components';
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChangePasswordCard } from './ChangePasswordCard';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

const changePasswordMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('@app/auth', async () => {
  const actual = await vi.importActual<typeof import('@app/auth')>('@app/auth');
  return {
    authClient: { changePassword: (...args: unknown[]) => changePasswordMock(...args) },
    mapAuthErrorMessage: actual.mapAuthErrorMessage,
  };
});

afterEach(() => {
  cleanup();
  changePasswordMock.mockReset();
  changePasswordMock.mockResolvedValue({ error: null });
});

function fillAndSubmit(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText(enMessages.account.changePassword.currentPasswordLabel), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText(enMessages.account.changePassword.newPasswordLabel), {
    target: { value: next },
  });
  fireEvent.change(screen.getByLabelText(enMessages.account.changePassword.confirmPasswordLabel), {
    target: { value: confirm },
  });
  fireEvent.click(screen.getByRole('button', { name: enMessages.account.changePassword.save }));
}

describe('ChangePasswordCard', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Смяна на парола' })).toBeTruthy();
    expect(screen.getByLabelText('Текуща парола')).toBeTruthy();
    expect(screen.getByLabelText('Нова парола')).toBeTruthy();
    expect(screen.getByLabelText('Потвърдете новата парола')).toBeTruthy();
    expect(screen.getByText('Изход от другите устройства')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Запази паролата' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Change password' })).toBeTruthy();
    expect(screen.getByLabelText('Current password')).toBeTruthy();
    expect(screen.getByLabelText('New password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm new password')).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('defaults "sign out of other devices" to checked', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    const checkbox = screen.getByLabelText('Sign out of other devices');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
  });

  it('rejects a new password shorter than 8 characters without calling the API', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('current-pass', 'short', 'short');

    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('rejects a confirmation that does not match the new password', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('current-pass', 'new-password-1', 'new-password-2');

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it('submits the current password, new password and revokeOtherSessions flag', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('old-password', 'new-password-1', 'new-password-1');

    expect(changePasswordMock).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password-1',
      revokeOtherSessions: true,
    });
  });

  it('maps an incorrect current password to a translated error', async () => {
    changePasswordMock.mockResolvedValueOnce({ error: { code: 'INVALID_PASSWORD' } });

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('wrong-password', 'new-password-1', 'new-password-1');

    expect(await screen.findByText('Current password is incorrect.')).toBeTruthy();
  });

  it('shows a success toast and clears the form after a successful change', async () => {
    const toastSpy = vi.spyOn(designComponents, 'toast').mockImplementation(() => 'toast-id');

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ChangePasswordCard />
      </NextIntlClientProvider>,
    );

    fillAndSubmit('old-password', 'new-password-1', 'new-password-1');

    await screen.findByRole('button', { name: 'Save password' });
    expect(toastSpy).toHaveBeenCalledWith({ title: 'Password changed' });
    expect((screen.getByLabelText('Current password') as HTMLInputElement).value).toBe('');
    toastSpy.mockRestore();
  });
});
