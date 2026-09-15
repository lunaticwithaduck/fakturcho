// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { DocumentDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentEmailDialog } from './DocumentEmailDialog';

vi.mock('@app/api', () => ({
  useSendDocumentEmailMutation: () => [vi.fn(), { isLoading: false }],
}));

afterEach(cleanup);

const document: DocumentDto = {
  id: 'doc-1',
  documentType: 'invoice',
  status: 'sent',
  number: 1,
  numberPrefix: null,
  numberSuffix: null,
  referenceNumber: null,
  originalDocumentId: null,
  issuedAt: '2026-09-01',
  taxEventAt: null,
  dueAt: null,
  validUntil: null,
  deliveryDate: null,
  buyerReference: null,
  paymentMeansCode: null,
  paymentTermsNote: null,
  subtotal: 1000,
  discountTotal: 0,
  amount: 1000,
  vatIncluded: true,
  vatRateBp: 2000,
  vatAmount: 0,
  vatExemptionGround: null,
  currency: 'EUR',
  clientId: null,
  preparedBy: null,
  notes: null,
  emailText: null,
  emailedAt: null,
  templateId: 'default',
  documentLanguage: null,
  issuer: {
    companyName: null,
    eik: null,
    mol: null,
    addressLine: null,
    street: null,
    postcode: null,
    countyRegion: null,
    city: null,
    country: null,
    phone: null,
    vatRegistered: null,
    vatNumber: null,
    bankName: null,
    iban: null,
    bic: null,
    altIban: null,
    identifiers: {},
  },
  recipient: {
    companyName: 'ACME EOOD',
    eik: null,
    vatNumber: null,
    address: null,
    street: null,
    postcode: null,
    countyRegion: null,
    city: null,
    country: null,
    email: 'client@example.com',
    mol: null,
    sdiRecipientCode: null,
    pec: null,
  },
  lineItems: [],
  discounts: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('DocumentEmailDialog', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentEmailDialog document={document} onOpenChange={vi.fn()} onSent={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Изпращане по имейл')).toBeTruthy();
    expect(screen.getByLabelText('Имейл на получателя')).toBeTruthy();
    expect(screen.getByLabelText('Съобщение')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изпрати' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentEmailDialog document={document} onOpenChange={vi.fn()} onSent={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Send by email')).toBeTruthy();
    expect(screen.getByLabelText('Recipient email')).toBeTruthy();
    expect(screen.getByLabelText('Message')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
