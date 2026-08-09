import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { ClientsModule } from './clients/clients.module';
import { AppExceptionFilter } from './common/app-exception.filter';
import { DocumentsModule } from './documents/documents.module';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { IssuerModule } from './issuer/issuer.module';
import { NumberingModule } from './numbering/numbering.module';
import { RenderModule } from './render/render.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IssuerModule,
    ClientsModule,
    CatalogueModule,
    DocumentsModule,
    NumberingModule,
    RenderModule,
    BillingModule,
    EmailModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
