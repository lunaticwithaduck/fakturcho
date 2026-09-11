import type { AdminFeatureFlagDto } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { parseOrThrow } from '../documents/zod-parse.util';
import { featureFlagKeySchema, updateFeatureFlagSchema } from './dto-schemas';
import { FeatureFlagsService } from './feature-flags.service';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminFeatureFlags)
export class AdminFeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  @Get()
  list(): Promise<AdminFeatureFlagDto[]> {
    return this.service.list();
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() body: unknown): Promise<AdminFeatureFlagDto> {
    const parsedKey = parseOrThrow(featureFlagKeySchema, key);
    const parsedBody = parseOrThrow(updateFeatureFlagSchema, body);
    return this.service.setEnabled(parsedKey, parsedBody.enabled);
  }
}
