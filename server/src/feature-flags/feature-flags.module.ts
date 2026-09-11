import { Global, Module } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { AdminFeatureFlagsController } from './admin-feature-flags.controller';
import { FeatureFlagGuard } from './feature-flag.guard';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';

@Global()
@Module({
  controllers: [FeatureFlagsController, AdminFeatureFlagsController],
  providers: [FeatureFlagsService, FeatureFlagGuard, AdminGuard],
  exports: [FeatureFlagsService, FeatureFlagGuard],
})
export class FeatureFlagsModule {}
