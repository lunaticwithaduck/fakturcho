import { Module } from '@nestjs/common';
import { SdiTransport } from './sdi-transport';

@Module({
  providers: [SdiTransport],
  exports: [SdiTransport],
})
export class ItTransportModule {}
