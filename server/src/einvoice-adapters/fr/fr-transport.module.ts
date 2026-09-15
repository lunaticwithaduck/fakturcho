import { Module } from '@nestjs/common';
import { ChorusProTransport } from './chorus-pro-transport';

@Module({
  providers: [ChorusProTransport],
  exports: [ChorusProTransport],
})
export class FrTransportModule {}
