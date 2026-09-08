import type { AdminMeDto, UserRole } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AdminGuard, type AdminRequest } from './admin.guard';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminMe)
export class AdminMeController {
  @Get()
  me(@Req() request: AdminRequest): AdminMeDto {
    const user = request.adminUser;
    if (!user) {
      throw new Error('AdminMeController used on a route without the admin guard');
    }
    return { id: user.id, email: user.email, name: user.name, role: user.role as UserRole };
  }
}
