import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { REQUIRE_FEATURE_FLAG_KEY } from '../../feature-flags/feature-flag.decorator';
import { FeatureFlagGuard } from '../../feature-flags/feature-flag.guard';
import { EinvoiceExportController } from './einvoice-export.controller';

const GUARDS_METADATA = '__guards__';

describe('EinvoiceExportController wiring', () => {
  it('gates readiness behind FeatureFlagGuard + EINVOICE', () => {
    const handler = EinvoiceExportController.prototype.readiness;
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(FeatureFlagGuard);
    expect(Reflect.getMetadata(REQUIRE_FEATURE_FLAG_KEY, handler)).toBe('EINVOICE');
  });

  it('gates xml behind FeatureFlagGuard + EINVOICE', () => {
    const handler = EinvoiceExportController.prototype.xml;
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(FeatureFlagGuard);
    expect(Reflect.getMetadata(REQUIRE_FEATURE_FLAG_KEY, handler)).toBe('EINVOICE');
  });
});
