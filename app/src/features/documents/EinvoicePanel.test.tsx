// @vitest-environment jsdom
import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { ClientDto } from '@shared/types';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EinvoicePanel } from './EinvoicePanel';

const client: ClientDto = {
  id: 'client-1',
  companyName: 'ACME EOOD',
  eik: null,
  vatNumber: null,
  address: null,
  street: null,
  postcode: null,
  countyRegion: null,
  country: 'DE',
  documentLanguage: null,
  email: null,
  mol: null,
  peppolEndpointId: '0088:1234567890123',
  peppolScheme: '0088',
  sdiRecipientCode: null,
  pec: null,
};

const sendMock = vi.fn().mockReturnValue({ unwrap: () => Promise.resolve({}) });
let readinessResult: { data: unknown } = { data: { ready: true, missingFields: [] } };
let transmissionResult: { data: unknown } = { data: null };

vi.mock('@app/api', () => ({
  useGetEinvoiceReadinessQuery: () => readinessResult,
  useGetEinvoiceTransmissionQuery: () => transmissionResult,
  useSendEinvoicePeppolMutation: () => [sendMock, { isLoading: false }],
  getEinvoiceXmlUrl: (id: string) => `/api/documents/${id}/einvoice/xml`,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  readinessResult = { data: { ready: true, missingFields: [] } };
  transmissionResult = { data: null };
});

function renderPanel(status: 'draft' | 'sent' | 'cancelled', clientDto: ClientDto | undefined) {
  return render(
    <NextIntlClientProvider locale="bg" messages={bgMessages}>
      <EinvoicePanel documentId="doc-1" status={status} client={clientDto} />
    </NextIntlClientProvider>,
  );
}

describe('EinvoicePanel', () => {
  it('renders nothing for a draft document', () => {
    renderPanel('draft', client);

    expect(screen.queryByRole('link', { name: 'Изтегли е-фактура (XML)' })).toBeNull();
  });

  it('shows the XML download link for an issued document', () => {
    renderPanel('sent', client);

    const link = screen.getByRole('link', { name: 'Изтегли е-фактура (XML)' });
    expect(link.getAttribute('href')).toBe('/api/documents/doc-1/einvoice/xml');
  });

  it('shows nothing extra when the document is einvoice-ready', () => {
    readinessResult = { data: { ready: true, missingFields: [] } };
    renderPanel('sent', client);

    expect(screen.queryByText(/Липсващи данни/)).toBeNull();
  });

  it('lists the missing fields when the document is not einvoice-ready', () => {
    readinessResult = {
      data: { ready: false, missingFields: ['issuer.vatNumber', 'recipient.address'] },
    };
    renderPanel('sent', client);

    expect(
      screen.getByText('Липсващи данни за е-фактура: issuer.vatNumber, recipient.address'),
    ).toBeTruthy();
  });

  it('hides the send-via-Peppol button when the client has no Peppol endpoint (scheme only)', () => {
    renderPanel('sent', { ...client, peppolEndpointId: null });

    expect(screen.queryByRole('button', { name: 'Изпрати през Peppol' })).toBeNull();
  });

  it('hides the send-via-Peppol button when the client has no Peppol scheme (endpoint only)', () => {
    renderPanel('sent', { ...client, peppolScheme: null });

    expect(screen.queryByRole('button', { name: 'Изпрати през Peppol' })).toBeNull();
  });

  it('hides the send-via-Peppol button when there is no client', () => {
    renderPanel('sent', undefined);

    expect(screen.queryByRole('button', { name: 'Изпрати през Peppol' })).toBeNull();
  });

  it('shows and calls the send mutation only when both the Peppol endpoint and scheme are set', () => {
    renderPanel('sent', client);

    fireEvent.click(screen.getByRole('button', { name: 'Изпрати през Peppol' }));

    expect(sendMock).toHaveBeenCalledWith('doc-1');
  });

  it('hides the send-via-Peppol button for a cancelled document', () => {
    renderPanel('cancelled', client);

    expect(screen.queryByRole('button', { name: 'Изпрати през Peppol' })).toBeNull();
  });

  it('shows the transmission status and error text once sent', () => {
    transmissionResult = {
      data: {
        documentId: 'doc-1',
        status: 'REJECTED',
        provider: 'test',
        providerMessageId: null,
        receipt: null,
        errorText: 'Invalid recipient endpoint',
        retryCount: 1,
        createdAt: '2026-09-09T00:00:00.000Z',
        updatedAt: '2026-09-09T00:00:00.000Z',
      },
    };
    renderPanel('sent', client);

    expect(screen.getByText('Отхвърлено')).toBeTruthy();
    expect(screen.getByText('Invalid recipient endpoint')).toBeTruthy();
  });

  it('resolves the English messages for the same keys without missing-key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <EinvoicePanel documentId="doc-1" status="sent" client={client} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'Download e-invoice (XML)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send via Peppol' })).toBeTruthy();
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
