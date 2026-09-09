import { Module } from '@nestjs/common';
import { DocumentsModule } from '../../documents/documents.module';
import { PeppolModule } from '../peppol.module';
import { EinvoiceSendController } from './einvoice-send.controller';
import { EinvoiceSendService } from './einvoice-send.service';

@Module({
  imports: [DocumentsModule, PeppolModule],
  controllers: [EinvoiceSendController],
  providers: [EinvoiceSendService],
})
export class PeppolHttpModule {}
