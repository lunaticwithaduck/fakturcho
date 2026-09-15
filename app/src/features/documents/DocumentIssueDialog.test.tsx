// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { DocumentDto, SeriesInfoDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentIssueDialog } from './DocumentIssueDialog';

const series: SeriesInfoDto[] = [
  { documentType: 'invoice', previousNumber: 15, nextNumber: 16, overridable: false },
];

vi.mock('@app/api', () => ({
  useListSeriesQuery: () => ({ data: series }),
  useIssueDocumentMutation: () => [vi.fn(), { isLoading: false }],
}));

afterEach(cleanup);

const document: DocumentDto = {
  id: 'doc-1',
  documentType: 'invoice',
  status: 'draft',
  number: null,
  numberPrefix: null,
  numberSuffix: null,
  referenceNumber: null,
  originalDocumentId: null,
  issuedAt: null,
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
    email: null,
    mol: null,
    sdiRecipientCode: null,
    pec: null,
  },
  lineItems: [],
  discounts: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

describe('DocumentIssueDialog', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentIssueDialog document={document} onOpenChange={vi.fn()} onIssued={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Издаване на документ')).toBeTruthy();
    expect(screen.getByText('Следващ номер в поредицата: 0000000016')).toBeTruthy();
    expect(screen.getByLabelText('Дата на издаване')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Отказ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Издай' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentIssueDialog document={document} onOpenChange={vi.fn()} onIssued={vi.fn()} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Issue document')).toBeTruthy();
    expect(screen.getByText('Next number in the series: 0000000016')).toBeTruthy();
    expect(screen.getByLabelText('Issue date')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Issue' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
