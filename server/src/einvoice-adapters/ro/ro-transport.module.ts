import { Module } from '@nestjs/common';
import { AnafTransport } from './anaf-transport';

@Module({
  providers: [AnafTransport],
  exports: [AnafTransport],
})
export class RoTransportModule {}
