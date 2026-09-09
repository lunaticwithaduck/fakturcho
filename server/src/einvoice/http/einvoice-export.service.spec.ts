import type { DocumentDto } from '@fakturcho/shared-types';
import { describe, expect, it, vi } from 'vitest';
import { DomainError } from '../../common/domain-error';
import type { DocumentsService } from '../../documents/documents.service';
import { XRECHNUNG_CUSTOMIZATION_ID } from '../../einvoice-adapters/de/xrechnung-mapper';
import { bgDomesticStandardInvoice } from '../__fixtures__/bg-domestic-standard';
import { deDomesticStandardInvoice } from '../__fixtures__/eu-domestic-standard';
import { EinvoiceExportService } from './einvoice-export.service';

function stubDocumentsService(document: DocumentDto): DocumentsService {
  return { get: vi.fn().mockResolvedValue(document) } as unknown as DocumentsService;
}

describe('EinvoiceExportService', () => {
  it('exports a BG-issuer document as core UBL XML', async () => {
    const service = new EinvoiceExportService(stubDocumentsService(bgDomesticStandardInvoice));
    const xml = await service.getXml('acc-1', bgDomesticStandardInvoice.id);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?><Invoice')).toBe(true);
    expect(xml).not.toContain(XRECHNUNG_CUSTOMIZATION_ID);
  });

  it('exports a DE-issuer document as XRechnung-flavored XML', async () => {
    const service = new EinvoiceExportService(stubDocumentsService(deDomesticStandardInvoice));
    const xml = await service.getXml('acc-1', deDomesticStandardInvoice.id);
    expect(xml).toContain(
      `<cbc:CustomizationID>${XRECHNUNG_CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    );
  });

  it('reports readiness for a complete issued document', async () => {
    const service = new EinvoiceExportService(stubDocumentsService(bgDomesticStandardInvoice));
    const result = await service.getReadiness('acc-1', bgDomesticStandardInvoice.id);
    expect(result).toEqual({ ready: true, missingFields: [] });
  });

  it('reports missing fields for an unissued document without throwing', async () => {
    const draft: DocumentDto = {
      ...bgDomesticStandardInvoice,
      status: 'draft',
      number: null,
      issuedAt: null,
    };
    const service = new EinvoiceExportService(stubDocumentsService(draft));
    const result = await service.getReadiness('acc-1', draft.id);
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain('document number (document must be issued)');
  });

  it('rejects exporting a draft document with DOCUMENT_NOT_ISSUED, not a raw crash', async () => {
    const draft: DocumentDto = {
      ...bgDomesticStandardInvoice,
      status: 'draft',
      number: null,
      issuedAt: null,
    };
    const service = new EinvoiceExportService(stubDocumentsService(draft));

    await expect(service.getXml('acc-1', draft.id)).rejects.toBeInstanceOf(DomainError);
    await expect(service.getXml('acc-1', draft.id)).rejects.toMatchObject({
      code: 'DOCUMENT_NOT_ISSUED',
    });
  });

  it('rejects exporting a proforma document with a clean VALIDATION_FAILED domain error', async () => {
    const proforma: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'proforma' };
    const service = new EinvoiceExportService(stubDocumentsService(proforma));

    await expect(service.getXml('acc-1', proforma.id)).rejects.toBeInstanceOf(DomainError);
    await expect(service.getXml('acc-1', proforma.id)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('rejects exporting a quote document with a clean VALIDATION_FAILED domain error', async () => {
    const quote: DocumentDto = { ...bgDomesticStandardInvoice, documentType: 'quote' };
    const service = new EinvoiceExportService(stubDocumentsService(quote));

    await expect(service.getXml('acc-1', quote.id)).rejects.toBeInstanceOf(DomainError);
    await expect(service.getXml('acc-1', quote.id)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });
});
