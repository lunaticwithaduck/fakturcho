// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { getMessagesMock, providerMock } = vi.hoisted(() => ({
  getMessagesMock: vi.fn(),
  providerMock: vi.fn(),
}));

vi.mock('next-intl/server', () => ({ getMessages: getMessagesMock }));
vi.mock('next-intl', () => ({
  NextIntlClientProvider: (props: { messages: unknown; children: ReactNode }) => {
    providerMock(props.messages);
    return props.children;
  },
}));

import { ClientMessages } from './ClientMessages';

describe('ClientMessages', () => {
  it('hands the client provider only the requested namespaces', async () => {
    getMessagesMock.mockResolvedValue({
      auth: { brandName: 'Fakturcho' },
      login: { title: 'Log in' },
      documents: { title: 'Documents' },
    });

    render(await ClientMessages({ namespaces: ['auth', 'login'], children: <span>child</span> }));

    expect(screen.getByText('child')).toBeTruthy();
    expect(providerMock).toHaveBeenCalledWith({
      auth: { brandName: 'Fakturcho' },
      login: { title: 'Log in' },
    });
  });
});
