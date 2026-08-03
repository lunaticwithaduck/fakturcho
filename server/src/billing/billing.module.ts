import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaddleService } from './paddle.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, PaddleService],
  exports: [BillingService],
})
export class BillingModule {}
