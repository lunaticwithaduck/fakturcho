import { Injectable } from '@nestjs/common';
import { DomainError } from '../../common/domain-error';
import { DocumentsService } from '../../documents/documents.service';
import type { EinvoiceReadinessResult } from './einvoice-mapper-selection';
import { selectEinvoiceReadinessCheck, selectEinvoiceXmlMapper } from './einvoice-mapper-selection';

@Injectable()
export class EinvoiceExportService {
  constructor(private readonly documentsService: DocumentsService) {}

  async getReadiness(accountId: string, documentId: string): Promise<EinvoiceReadinessResult> {
    const document = await this.documentsService.get(accountId, documentId);
    return selectEinvoiceReadinessCheck(document.issuer.country)(document);
  }

  async getXml(accountId: string, documentId: string): Promise<string> {
    const document = await this.documentsService.get(accountId, documentId);

    if (document.status === 'draft') {
      throw new DomainError(
        'DOCUMENT_NOT_ISSUED',
        'Only an issued document can be exported as an e-invoice.',
      );
    }

    try {
      return selectEinvoiceXmlMapper(document.issuer.country)(document);
    } catch (error) {
      if (error instanceof DomainError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new DomainError('VALIDATION_FAILED', message);
    }
  }
}
