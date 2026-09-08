import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminCreditsController } from './admin-credits.controller';
import { AdminCreditsService } from './admin-credits.service';
import { AdminDocumentsController } from './admin-documents.controller';
import { AdminDocumentsService } from './admin-documents.service';
import { AdminMeController } from './admin-me.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminTrafficController } from './admin-traffic.controller';
import { AdminTrafficService } from './admin-traffic.service';
import { AdminUsageController } from './admin-usage.controller';
import { AdminUsageService } from './admin-usage.service';
import { UmamiClient } from './umami.client';

@Module({
  controllers: [
    AdminMeController,
    AdminAccountsController,
    AdminDocumentsController,
    AdminSubscriptionsController,
    AdminUsageController,
    AdminReportsController,
    AdminCreditsController,
    AdminTrafficController,
  ],
  providers: [
    AdminGuard,
    AdminAccountsService,
    AdminDocumentsService,
    AdminSubscriptionsService,
    AdminUsageService,
    AdminReportsService,
    AdminCreditsService,
    AdminTrafficService,
    UmamiClient,
  ],
})
export class AdminModule {}
