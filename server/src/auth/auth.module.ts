import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { EMAIL_SENDER, type EmailSender } from '../email/ports';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { createAuth } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AUTH_INSTANCE } from './auth.tokens';
import { MeController } from './me.controller';

@Module({
  imports: [EmailModule],
  controllers: [AuthController, MeController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: (prisma: PrismaService, flags: FeatureFlagsService, sender: EmailSender) =>
        createAuth(
          prisma,
          {
            secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
            baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
            trustedOrigins: (process.env.APP_ORIGINS ?? 'http://localhost:3000').split(','),
          },
          flags,
          sender,
        ),
      inject: [PrismaService, FeatureFlagsService, EMAIL_SENDER],
    },
    AuthGuard,
  ],
  exports: [AUTH_INSTANCE, AuthGuard],
})
export class AuthModule {}
