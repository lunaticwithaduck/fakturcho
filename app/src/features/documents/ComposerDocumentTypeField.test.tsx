// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ComposerDocumentTypeField } from './ComposerDocumentTypeField';

afterEach(cleanup);

describe('ComposerDocumentTypeField', () => {
  it('renders the Bulgarian selected type label unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <ComposerDocumentTypeField value="credit_note" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Вид документ')).toBeTruthy();
    expect(screen.getByText('Кредитно известие')).toBeTruthy();
  });

  it('renders the English selected type label instead of Bulgarian', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <ComposerDocumentTypeField value="credit_note" onChange={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByLabelText('Document type')).toBeTruthy();
    expect(screen.getByText('Credit note')).toBeTruthy();
    expect(screen.queryByText('Кредитно известие')).toBeNull();
  });
});
