import type { IssuerProfileDto } from '@fakturcho/shared-types';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { z } from 'zod';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import type { UpdateIssuerProfileInput } from './issuer.service';
import { IssuerService } from './issuer.service';

const updateIssuerProfileSchema = z.object({
  companyName: z.string().nullable().optional(),
  eik: z.string().nullable().optional(),
  mol: z.string().nullable().optional(),
  addressLine: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  vatRegistered: z.boolean().optional(),
  vatNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  altIban: z.string().nullable().optional(),
});

function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      details[key] = [...(details[key] ?? []), issue.message];
    }
    throw new DomainError('VALIDATION_FAILED', 'Invalid request body', details);
  }
  return result.data;
}

@Controller('api/issuer-profile')
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) {}

  @Get()
  getProfile(@AccountId() accountId: string): Promise<IssuerProfileDto> {
    return this.issuerService.getProfile(accountId);
  }

  @Put()
  updateProfile(@AccountId() accountId: string, @Body() body: unknown): Promise<IssuerProfileDto> {
    const input: UpdateIssuerProfileInput = parseBody(updateIssuerProfileSchema, body);
    return this.issuerService.updateProfile(accountId, input);
  }
}
