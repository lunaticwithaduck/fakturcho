import { Module } from '@nestjs/common';
import { NotConfiguredPeppolTransport } from './not-configured-peppol-transport';
import { PeppolService } from './peppol.service';
import { PEPPOL_TRANSPORT } from './peppol-transport.interface';

@Module({
  providers: [
    NotConfiguredPeppolTransport,
    { provide: PEPPOL_TRANSPORT, useExisting: NotConfiguredPeppolTransport },
    PeppolService,
  ],
  exports: [PeppolService],
})
export class PeppolModule {}
