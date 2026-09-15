// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { DocumentStatusBadge } from './DocumentStatusBadge';

afterEach(cleanup);

describe('DocumentStatusBadge', () => {
  it('renders the Bulgarian status labels unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentStatusBadge status="paid" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('ПЛАТЕНО')).toBeTruthy();
  });

  it('renders English status labels instead of Bulgarian when the locale is English', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentStatusBadge status="paid" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('PAID')).toBeTruthy();
    expect(screen.queryByText('ПЛАТЕНО')).toBeNull();
  });

  it.each([
    ['draft', 'Чернова', 'Draft'],
    ['sent', 'Издадена', 'Issued'],
    ['overdue', 'ПРОСРОЧЕНА', 'OVERDUE'],
    ['cancelled', 'АНУЛИРАНА', 'CANCELLED'],
  ] as const)('renders %s as %s in Bulgarian and %s in English', (status, bg, en) => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentStatusBadge status={status} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(bg)).toBeTruthy();
    cleanup();

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentStatusBadge status={status} />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText(en)).toBeTruthy();
  });
});
