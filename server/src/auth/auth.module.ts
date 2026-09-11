import { Module } from '@nestjs/common';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { createAuth } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AUTH_INSTANCE } from './auth.tokens';
import { MeController } from './me.controller';

@Module({
  controllers: [AuthController, MeController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: (prisma: PrismaService, flags: FeatureFlagsService) =>
        createAuth(
          prisma,
          {
            secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
            baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
            trustedOrigins: (process.env.APP_ORIGINS ?? 'http://localhost:3000').split(','),
          },
          flags,
        ),
      inject: [PrismaService, FeatureFlagsService],
    },
    AuthGuard,
  ],
  exports: [AUTH_INSTANCE, AuthGuard],
})
export class AuthModule {}
