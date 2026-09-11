import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { REQUIRE_FEATURE_FLAG_KEY } from '../../feature-flags/feature-flag.decorator';
import { FeatureFlagGuard } from '../../feature-flags/feature-flag.guard';
import { EinvoiceSendController } from './einvoice-send.controller';

const GUARDS_METADATA = '__guards__';

describe('EinvoiceSendController wiring', () => {
  it('gates send behind FeatureFlagGuard + PEPPOL', () => {
    const handler = EinvoiceSendController.prototype.send;
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(FeatureFlagGuard);
    expect(Reflect.getMetadata(REQUIRE_FEATURE_FLAG_KEY, handler)).toBe('PEPPOL');
  });

  it('gates getTransmission behind FeatureFlagGuard + PEPPOL', () => {
    const handler = EinvoiceSendController.prototype.getTransmission;
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(FeatureFlagGuard);
    expect(Reflect.getMetadata(REQUIRE_FEATURE_FLAG_KEY, handler)).toBe('PEPPOL');
  });
});
