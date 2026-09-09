import type { MeDto } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get } from '@nestjs/common';
import { UserId } from '../common/user-id.decorator';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Controller(API_ROUTES.me)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@UserId() userId: string): Promise<MeDto> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as MeDto['role'],
      locale: user.locale as MeDto['locale'],
    };
  }
}
