import { Module } from '@nestjs/common';
import { KsefTransport } from './ksef-transport';

@Module({
  providers: [KsefTransport],
  exports: [KsefTransport],
})
export class PlTransportModule {}
