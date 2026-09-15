import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { VerifactuChainLink } from './verifactu-mapper';

export interface VerifactuChainStore {
  getLast(issuerNif: string): Promise<VerifactuChainLink | null>;
  save(issuerNif: string, link: VerifactuChainLink): Promise<void>;
}

export const VERIFACTU_CHAIN_STORE = Symbol('VERIFACTU_CHAIN_STORE');

@Injectable()
export class PrismaVerifactuChainStore implements VerifactuChainStore {
  constructor(private readonly prisma: PrismaService) {}

  async getLast(issuerNif: string): Promise<VerifactuChainLink | null> {
    const row = await this.prisma.esVerifactuChainLink.findUnique({ where: { issuerNif } });
    if (!row) return null;
    return {
      idEmisorFactura: issuerNif,
      numSerieFactura: row.numSerieFactura,
      fechaExpedicionFactura: row.fechaExpedicion,
      huella: row.huella,
    };
  }

  async save(issuerNif: string, link: VerifactuChainLink): Promise<void> {
    await this.prisma.esVerifactuChainLink.upsert({
      where: { issuerNif },
      create: {
        issuerNif,
        numSerieFactura: link.numSerieFactura,
        fechaExpedicion: link.fechaExpedicionFactura,
        huella: link.huella,
      },
      update: {
        numSerieFactura: link.numSerieFactura,
        fechaExpedicion: link.fechaExpedicionFactura,
        huella: link.huella,
      },
    });
  }
}
