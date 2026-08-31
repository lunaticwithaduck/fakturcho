import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { CreditsService } from './credits.service';
import { WiseService } from './wise.service';

@Module({
  controllers: [BillingController],
  providers: [CreditsService, WiseService],
  exports: [CreditsService],
})
export class BillingModule {}
