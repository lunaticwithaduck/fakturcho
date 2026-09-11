import { Inject, Injectable } from '@nestjs/common';
import { EINVOICE_TRANSPORTS, type EinvoiceTransport } from './einvoice-transport.interface';

@Injectable()
export class EinvoiceTransportRegistry {
  constructor(@Inject(EINVOICE_TRANSPORTS) private readonly transports: EinvoiceTransport[]) {}

  forCountry(country: string | null): EinvoiceTransport | null {
    if (!country) return null;
    const normalized = country.trim().toUpperCase();
    return this.transports.find((transport) => transport.country === normalized) ?? null;
  }
}
