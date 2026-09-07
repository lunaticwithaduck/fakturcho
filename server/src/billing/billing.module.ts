import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { RevolutService } from './revolut.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, CreditsService, RevolutService],
  exports: [BillingService, CreditsService],
})
export class BillingModule {}
