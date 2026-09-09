// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentActionBar } from './DocumentActionBar';

afterEach(cleanup);

const baseProps = {
  documentId: 'doc-1',
  isMarkingPaid: false,
  onIssue: vi.fn(),
  onMarkPaid: vi.fn(),
  onCancel: vi.fn(),
  onEmail: vi.fn(),
};

describe('DocumentActionBar', () => {
  it('renders the Bulgarian copy unchanged for a draft', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentActionBar {...baseProps} status="draft" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Редактирай' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Издай' })).toBeTruthy();
  });

  it('renders the Bulgarian copy unchanged for a sent document', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentActionBar {...baseProps} status="sent" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Отбележи като платена' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изпрати по имейл' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Анулирай' })).toBeTruthy();
  });

  it('shows the marking-paid label while pending', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentActionBar {...baseProps} status="sent" isMarkingPaid />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Отбелязване...' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentActionBar {...baseProps} status="paid" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('button', { name: 'Send by email' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
