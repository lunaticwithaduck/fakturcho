// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EinvoicePanel } from './EinvoicePanel';

let readinessResult: { data: unknown } = { data: { ready: true, missingFields: [] } };
let flagsResult = { EN_LOCALE: true, EINVOICE: true };

vi.mock('@app/api', () => ({
  useGetEinvoiceReadinessQuery: () => readinessResult,
  getEinvoiceXmlUrl: (id: string) => `/api/documents/${id}/einvoice/xml`,
  useSetDocumentKsefNumberMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock('@app/feature-flags', () => ({
  useFeatureFlags: () => flagsResult,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  readinessResult = { data: { ready: true, missingFields: [] } };
  flagsResult = { EN_LOCALE: true, EINVOICE: true };
});

function renderPanel(
  status: 'draft' | 'sent' | 'cancelled',
  documentType: 'invoice' | 'delivery_note' = 'invoice',
  issuerCountry: string | null = null,
) {
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <EinvoicePanel
        documentId="doc-1"
        documentType={documentType}
        status={status}
        issuerCountry={issuerCountry}
      />
    </NextIntlClientProvider>,
  );
}

describe('EinvoicePanel', () => {
  it('renders nothing for a draft document', () => {
    renderPanel('draft');

    expect(screen.queryByRole('link', { name: 'Изтегли е-фактура (XML)' })).toBeNull();
  });

  it('shows the XML download link for an issued document', () => {
    renderPanel('sent');

    const link = screen.getByRole('link', { name: 'Изтегли е-фактура (XML)' });
    expect(link.getAttribute('href')).toBe('/api/documents/doc-1/einvoice/xml');
  });

  it('shows nothing extra when the document is einvoice-ready', () => {
    readinessResult = { data: { ready: true, missingFields: [] } };
    renderPanel('sent');

    expect(screen.queryByText(/Липсващи данни/)).toBeNull();
  });

  it('lists the missing fields when the document is not einvoice-ready', () => {
    readinessResult = {
      data: { ready: false, missingFields: ['issuer.vatNumber', 'recipient.street'] },
    };
    renderPanel('sent');

    expect(
      screen.getByText(
        'Липсващи данни за е-фактура: Липсва ДДС номер на издателя., Липсва адрес (улица) на получателя.',
      ),
    ).toBeTruthy();
  });

  it('deduplicates repeated missing-field codes', () => {
    readinessResult = {
      data: { ready: false, missingFields: ['line.unitCode', 'line.unitCode'] },
    };
    renderPanel('sent');

    expect(
      screen.getByText(
        'Липсващи данни за е-фактура: На един или повече редове липсва мерна единица.',
      ),
    ).toBeTruthy();
  });

  it('falls back to a generic hint for an unknown missing-field code', () => {
    readinessResult = {
      data: { ready: false, missingFields: ['some.future.code'] },
    };
    renderPanel('sent');

    expect(
      screen.getByText('Липсващи данни за е-фактура: Липсват данни за е-фактура.'),
    ).toBeTruthy();
  });

  it('translates the same missing-field codes into English', () => {
    readinessResult = {
      data: { ready: false, missingFields: ['issuer.vatNumber'] },
    };
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <EinvoicePanel documentId="doc-1" documentType="invoice" status="sent" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('Missing e-invoice data: Missing issuer VAT number.')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <EinvoicePanel documentId="doc-1" documentType="invoice" status="sent" />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Download e-invoice (XML)' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('EINVOICE off: renders nothing at all for an issued document', () => {
    flagsResult = { EN_LOCALE: true, EINVOICE: false };
    renderPanel('sent');

    expect(screen.queryByRole('link', { name: 'Изтегли е-фактура (XML)' })).toBeNull();
  });

  it('renders nothing at all for a delivery note, even when issued', () => {
    renderPanel('sent', 'delivery_note');

    expect(screen.queryByRole('link', { name: 'Изтегли е-фактура (XML)' })).toBeNull();
  });

  it('shows the KSeF number field for a PL-issued document', () => {
    renderPanel('sent', 'invoice', 'PL');

    expect(screen.getByLabelText('Номер в KSeF')).toBeTruthy();
  });

  it('hides the KSeF number field for a non-PL issuer', () => {
    renderPanel('sent', 'invoice', 'BG');

    expect(screen.queryByLabelText('Номер в KSeF')).toBeNull();
  });
});
