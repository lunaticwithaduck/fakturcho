import { Module } from '@nestjs/common';
import { DocumentsModule } from '../../documents/documents.module';
import { EinvoiceTransportModule } from '../../einvoice/transport/einvoice-transport.module';
import { PeppolModule } from '../peppol.module';
import { EinvoiceSendController } from './einvoice-send.controller';
import { EinvoiceSendService } from './einvoice-send.service';

@Module({
  imports: [DocumentsModule, PeppolModule, EinvoiceTransportModule],
  controllers: [EinvoiceSendController],
  providers: [EinvoiceSendService],
})
export class PeppolHttpModule {}
