import type { Type } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { EINVOICE_TRANSPORTS, type EinvoiceTransport } from './einvoice-transport.interface';
import { EinvoiceTransportRegistry } from './transport-registry';

// Each country worker adds its module here and its transport class to the
// token list below — nothing else in this file changes.
const COUNTRY_TRANSPORT_MODULES: Type<unknown>[] = [];
const COUNTRY_TRANSPORT_TOKENS: Type<EinvoiceTransport>[] = [];

@Module({
  imports: [...COUNTRY_TRANSPORT_MODULES],
  providers: [
    {
      provide: EINVOICE_TRANSPORTS,
      useFactory: (...transports: EinvoiceTransport[]) => transports,
      inject: COUNTRY_TRANSPORT_TOKENS,
    },
    EinvoiceTransportRegistry,
  ],
  exports: [EinvoiceTransportRegistry],
})
export class EinvoiceTransportModule {}
