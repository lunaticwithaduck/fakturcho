import { Module } from '@nestjs/common';
import { EsTransport } from './es-transport';
import { FaceTransport } from './face-transport';
import { PrismaVerifactuChainStore, VERIFACTU_CHAIN_STORE } from './verifactu-chain-store';
import { VerifactuTransport } from './verifactu-transport';

@Module({
  providers: [
    PrismaVerifactuChainStore,
    { provide: VERIFACTU_CHAIN_STORE, useExisting: PrismaVerifactuChainStore },
    VerifactuTransport,
    FaceTransport,
    EsTransport,
  ],
  exports: [EsTransport],
})
export class EsTransportModule {}
