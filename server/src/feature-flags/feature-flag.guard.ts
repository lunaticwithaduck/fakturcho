import type { FeatureFlagKey } from '@fakturcho/shared-types';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '../common/domain-error';
import { REQUIRE_FEATURE_FLAG_KEY } from './feature-flag.decorator';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * Makes a route behave as if it did not exist while its flag is off: a 404
 * with no distinguishing detail, not a 403 or an explanatory message.
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly flags: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<FeatureFlagKey | undefined>(
      REQUIRE_FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!key) return true;

    const enabled = await this.flags.isEnabled(key);
    if (!enabled) {
      throw new DomainError('NOT_FOUND', 'Not found');
    }
    return true;
  }
}
