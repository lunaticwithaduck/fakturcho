import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { EinvoiceExportController } from '../einvoice/http/einvoice-export.controller';
import { EinvoiceExportService } from '../einvoice/http/einvoice-export.service';
import { NumberingModule } from '../numbering/numbering.module';
import { ExchangeRateService } from '../vat-eu/exchange-rate.service';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [NumberingModule, BillingModule],
  controllers: [DocumentsController, EinvoiceExportController],
  providers: [
    DocumentsService,
    DocumentIssuanceService,
    EinvoiceExportService,
    ExchangeRateService,
  ],
  exports: [DocumentsService, DocumentIssuanceService],
})
export class DocumentsModule {}
