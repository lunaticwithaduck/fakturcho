import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import type { Request, Response } from 'express';
import type { Auth } from './auth.config';
import { AUTH_INSTANCE } from './auth.tokens';
import { Public } from './public.decorator';

@Controller('api/auth')
export class AuthController {
  private readonly handler: ReturnType<typeof toNodeHandler>;

  constructor(@Inject(AUTH_INSTANCE) auth: Auth) {
    this.handler = toNodeHandler(auth);
  }

  @Public()
  @All('*')
  handle(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.handler(req, res);
  }
}
