import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const AccountId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ accountId?: string }>();
  if (!request.accountId) {
    throw new Error('AccountId decorator used on a route without the auth guard');
  }
  return request.accountId;
});
