import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller(API_ROUTES.health)
export class HealthController {
  @Public()
  @Get()
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
