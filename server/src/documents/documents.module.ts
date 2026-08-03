import { Module } from '@nestjs/common';
import { NumberingModule } from '../numbering/numbering.module';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [NumberingModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentIssuanceService],
  exports: [DocumentsService, DocumentIssuanceService],
})
export class DocumentsModule {}
