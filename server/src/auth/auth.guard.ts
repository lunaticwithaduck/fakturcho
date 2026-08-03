import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { DomainError } from '../common/domain-error';
import type { Auth } from './auth.config';
import { AUTH_INSTANCE } from './auth.tokens';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface AuthenticatedRequest extends Request {
  accountId?: string;
  userId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_INSTANCE) private readonly auth: Auth,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });
    if (!session) {
      throw new DomainError('UNAUTHORIZED', 'Authentication required');
    }
    const accountId = session.user.accountId;
    if (!accountId) {
      throw new DomainError('UNAUTHORIZED', 'Account not provisioned');
    }
    request.accountId = accountId;
    request.userId = session.user.id;
    return true;
  }
}
