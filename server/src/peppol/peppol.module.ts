import { Module } from '@nestjs/common';
import { MockPeppolTransport } from './mock-peppol-transport';
import { PeppolService } from './peppol.service';
import { PEPPOL_TRANSPORT } from './peppol-transport.interface';

@Module({
  providers: [
    MockPeppolTransport,
    { provide: PEPPOL_TRANSPORT, useExisting: MockPeppolTransport },
    PeppolService,
  ],
  exports: [PeppolService],
})
export class PeppolModule {}
