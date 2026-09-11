import type { AdminFeatureFlagDto, FeatureFlagKey, FeatureFlagsDto } from '@fakturcho/shared-types';
import { FEATURE_FLAG_KEYS } from '@fakturcho/shared-types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

const CACHE_TTL_MS = 5_000;

@Injectable()
export class FeatureFlagsService {
  private cache: FeatureFlagsDto | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<FeatureFlagsDto> {
    if (this.cache && Date.now() < this.cacheExpiresAt) return this.cache;

    const rows = await this.prisma.featureFlag.findMany();
    const enabledByKey = new Map(rows.map((row) => [row.key, row.enabled]));
    const flags = Object.fromEntries(
      FEATURE_FLAG_KEYS.map((key) => [key, enabledByKey.get(key) ?? false]),
    ) as FeatureFlagsDto;

    this.cache = flags;
    this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return flags;
  }

  async isEnabled(key: FeatureFlagKey): Promise<boolean> {
    const flags = await this.getAll();
    return flags[key];
  }

  async list(): Promise<AdminFeatureFlagDto[]> {
    const rows = await this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    return rows.map((row) => ({
      key: row.key as FeatureFlagKey,
      enabled: row.enabled,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async setEnabled(key: FeatureFlagKey, enabled: boolean): Promise<AdminFeatureFlagDto> {
    const row = await this.prisma.featureFlag.update({ where: { key }, data: { enabled } });
    this.invalidate();
    return {
      key: row.key as FeatureFlagKey,
      enabled: row.enabled,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  invalidate(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }
}
