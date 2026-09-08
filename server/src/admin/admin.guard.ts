import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { DomainError } from '../common/domain-error';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

export interface AdminRequest extends Request {
  userId?: string;
  accountId?: string;
  adminUser?: User;
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    if (!request.userId) {
      throw new DomainError('UNAUTHORIZED', 'Authentication required');
    }
    const user = await this.prisma.user.findUnique({ where: { id: request.userId } });
    if (user?.role !== 'admin') {
      throw new DomainError('FORBIDDEN', 'Admin access required');
    }
    request.adminUser = user;
    return true;
  }
}
