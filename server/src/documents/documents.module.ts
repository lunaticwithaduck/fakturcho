import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { NumberingModule } from '../numbering/numbering.module';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [NumberingModule, BillingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentIssuanceService],
  exports: [DocumentsService, DocumentIssuanceService],
})
export class DocumentsModule {}
