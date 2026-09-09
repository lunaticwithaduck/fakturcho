// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { DocumentDto } from '@shared/types';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocumentViewPage } from './DocumentViewPage';

const document: DocumentDto = {
  id: 'doc-1',
  documentType: 'invoice',
  status: 'sent',
  number: 16,
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
    city: null,
    country: null,
    phone: null,
    vatRegistered: null,
    vatNumber: null,
    bankName: null,
    iban: null,
    bic: null,
    altIban: null,
  },
  recipient: {
    companyName: 'ACME EOOD',
    eik: null,
    vatNumber: null,
    address: null,
    street: null,
    postcode: null,
    country: null,
    email: 'client@example.com',
    mol: null,
  },
  lineItems: [],
  discounts: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

vi.mock('@app/api', () => ({
  useGetDocumentQuery: () => ({ data: document, isLoading: false }),
  useGetClientQuery: () => ({ data: undefined }),
  useCancelDocumentMutation: () => [vi.fn(), { isLoading: false }],
  useMarkDocumentPaidMutation: () => [vi.fn(), { isLoading: false }],
  useGetEinvoiceReadinessQuery: () => ({ data: { ready: true, missingFields: [] } }),
  useGetEinvoiceTransmissionQuery: () => ({ data: null }),
  useSendEinvoicePeppolMutation: () => [vi.fn(), { isLoading: false }],
  getDocumentPreviewUrl: (id: string) => `/api/documents/${id}/render?disposition=inline`,
  getDocumentRenderUrl: (id: string) => `/api/documents/${id}/render`,
  getEinvoiceXmlUrl: (id: string) => `/api/documents/${id}/einvoice/xml`,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

afterEach(cleanup);

describe('DocumentViewPage', () => {
  it('renders the Bulgarian copy unchanged', () => {
    render(
      <NextIntlClientProvider locale="bg" messages={bgMessages}>
        <DocumentViewPage documentId="doc-1" autoOpenIssue={false} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Фактура № 0000000016 (Оригинал)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Отбележи като платена' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Изпрати по имейл' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Анулирай' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Изтегли PDF' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Изтегли е-фактура (XML)' })).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <DocumentViewPage documentId="doc-1" autoOpenIssue={false} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Фактура No. 0000000016 (Original)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mark as paid' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send by email' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download PDF' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download e-invoice (XML)' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
