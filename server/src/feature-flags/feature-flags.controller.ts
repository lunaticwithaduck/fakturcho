import type { FeatureFlagsDto } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { FeatureFlagsService } from './feature-flags.service';

@Controller(API_ROUTES.featureFlags)
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Public()
  @Get()
  getAll(): Promise<FeatureFlagsDto> {
    return this.service.getAll();
  }
}
