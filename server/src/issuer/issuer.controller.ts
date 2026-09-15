import type { IssuerProfileDto } from '@fakturcho/shared-types';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { z } from 'zod';
import { AccountId } from '../common/account-id.decorator';
import { withCountryFieldPatterns } from '../common/country-field-patterns';
import { DomainError } from '../common/domain-error';
import {
  countryCodeSchema,
  countyRegionSchema,
  peppolEndpointIdSchema,
  peppolSchemeSchema,
  postcodeSchema,
  streetSchema,
} from '../common/eu-field-schemas';
import type { UpdateIssuerProfileInput } from './issuer.service';
import { IssuerService } from './issuer.service';

const baseUpdateIssuerProfileSchema = z.object({
  companyName: z.string().nullable().optional(),
  eik: z.string().nullable().optional(),
  mol: z.string().nullable().optional(),
  addressLine: z.string().nullable().optional(),
  street: streetSchema.nullable().optional(),
  postcode: postcodeSchema.nullable().optional(),
  countyRegion: countyRegionSchema.nullable().optional(),
  city: z.string().nullable().optional(),
  country: countryCodeSchema.optional(),
  phone: z.string().nullable().optional(),
  vatRegistered: z.boolean().optional(),
  vatNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  bic: z.string().nullable().optional(),
  altIban: z.string().nullable().optional(),
  identifiers: z.record(z.string(), z.string()).optional(),
  peppolEndpointId: peppolEndpointIdSchema.nullable().optional(),
  peppolScheme: peppolSchemeSchema.nullable().optional(),
});

export const updateIssuerProfileSchema = withCountryFieldPatterns(baseUpdateIssuerProfileSchema);

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
  async updateProfile(
    @AccountId() accountId: string,
    @Body() body: unknown,
  ): Promise<IssuerProfileDto> {
    const bodyCountry =
      typeof body === 'object' && body !== null && 'country' in body
        ? (body as { country?: unknown }).country
        : undefined;
    const fallbackCountry =
      typeof bodyCountry === 'string'
        ? undefined
        : (await this.issuerService.getProfile(accountId)).country;
    const schema = withCountryFieldPatterns(baseUpdateIssuerProfileSchema, fallbackCountry);
    const input: UpdateIssuerProfileInput = parseBody(schema, body);
    return this.issuerService.updateProfile(accountId, input);
  }
}
