import type { Type } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ChorusProTransport } from '../../einvoice-adapters/fr/chorus-pro-transport';
import { FrTransportModule } from '../../einvoice-adapters/fr/fr-transport.module';
import { ItTransportModule } from '../../einvoice-adapters/it/it-transport.module';
import { SdiTransport } from '../../einvoice-adapters/it/sdi-transport';
import { KsefTransport } from '../../einvoice-adapters/pl/ksef-transport';
import { PlTransportModule } from '../../einvoice-adapters/pl/pl-transport.module';
import { AnafTransport } from '../../einvoice-adapters/ro/anaf-transport';
import { RoTransportModule } from '../../einvoice-adapters/ro/ro-transport.module';
import { EINVOICE_TRANSPORTS, type EinvoiceTransport } from './einvoice-transport.interface';
import { EinvoiceTransportRegistry } from './transport-registry';

const COUNTRY_TRANSPORT_MODULES: Type<unknown>[] = [
  RoTransportModule,
  ItTransportModule,
  PlTransportModule,
  FrTransportModule,
];
const COUNTRY_TRANSPORT_TOKENS: Type<EinvoiceTransport>[] = [
  AnafTransport,
  SdiTransport,
  KsefTransport,
  ChorusProTransport,
];

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
