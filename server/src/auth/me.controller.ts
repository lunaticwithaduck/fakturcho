import type { MeDto } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Controller(API_ROUTES.me)
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FeatureFlagsService,
  ) {}

  @Get()
  async me(@UserId() userId: string): Promise<MeDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const enLocale = await this.flags.isEnabled('EN_LOCALE');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as MeDto['role'],
      locale: enLocale ? (user.locale as MeDto['locale']) : 'bg',
    };
  }
}
