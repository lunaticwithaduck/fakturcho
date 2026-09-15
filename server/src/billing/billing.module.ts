import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { RevolutService } from './revolut.service';
import { SubscriptionExpiryScheduler } from './subscription-expiry.scheduler';

@Module({
  controllers: [BillingController],
  providers: [BillingService, CreditsService, RevolutService, SubscriptionExpiryScheduler],
  exports: [BillingService, CreditsService],
})
export class BillingModule {}
