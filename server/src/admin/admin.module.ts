import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminDocumentsController } from './admin-documents.controller';
import { AdminDocumentsService } from './admin-documents.service';
import { AdminMeController } from './admin-me.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminUsageController } from './admin-usage.controller';
import { AdminUsageService } from './admin-usage.service';

@Module({
  controllers: [
    AdminMeController,
    AdminAccountsController,
    AdminDocumentsController,
    AdminSubscriptionsController,
    AdminUsageController,
    AdminReportsController,
  ],
  providers: [
    AdminGuard,
    AdminAccountsService,
    AdminDocumentsService,
    AdminSubscriptionsService,
    AdminUsageService,
    AdminReportsService,
  ],
})
export class AdminModule {}
