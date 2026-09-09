import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const UserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<{ userId?: string }>();
  if (!request.userId) {
    throw new Error('UserId decorator used on a route without the auth guard');
  }
  return request.userId;
});
