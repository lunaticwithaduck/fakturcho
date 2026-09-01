import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { PaddleService } from './paddle.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, CreditsService, PaddleService],
  exports: [BillingService, CreditsService],
})
export class BillingModule {}
