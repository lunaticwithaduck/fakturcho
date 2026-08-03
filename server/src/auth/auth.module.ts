import { Module } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { createAuth } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AUTH_INSTANCE } from './auth.tokens';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: (prisma: PrismaService) =>
        createAuth(prisma, {
          secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
          baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
        }),
      inject: [PrismaService],
    },
    AuthGuard,
  ],
  exports: [AUTH_INSTANCE, AuthGuard],
})
export class AuthModule {}
