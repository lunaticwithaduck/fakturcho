import type { ClientDto } from '@fakturcho/shared-types';
import { CLIENT_TYPES, DOCUMENT_LANGUAGES } from '@fakturcho/shared-types';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { AccountId } from '../common/account-id.decorator';
import { withCountryFieldPatterns } from '../common/country-field-patterns';
import { DomainError } from '../common/domain-error';
import {
  countryCodeSchema,
  countyRegionSchema,
  pecSchema,
  peppolEndpointIdSchema,
  peppolSchemeSchema,
  postcodeSchema,
  sdiRecipientCodeSchema,
  streetSchema,
} from '../common/eu-field-schemas';
import type { CreateClientInput, UpdateClientInput } from './clients.service';
import { ClientsService } from './clients.service';

const baseClientSchema = z.object({
  companyName: z.string().min(1),
  eik: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  street: streetSchema.nullable().optional(),
  postcode: postcodeSchema.nullable().optional(),
  countyRegion: countyRegionSchema.nullable().optional(),
  city: z.string().nullable().optional(),
  country: countryCodeSchema.optional(),
  documentLanguage: z.enum(DOCUMENT_LANGUAGES).nullable().optional(),
  email: z.string().nullable().optional(),
  mol: z.string().nullable().optional(),
  peppolEndpointId: peppolEndpointIdSchema.nullable().optional(),
  peppolScheme: peppolSchemeSchema.nullable().optional(),
  sdiRecipientCode: sdiRecipientCodeSchema.nullable().optional(),
  pec: pecSchema.nullable().optional(),
  clientType: z.enum(CLIENT_TYPES).nullable().optional(),
});

export const createClientSchema = withCountryFieldPatterns(baseClientSchema, 'BG');

const baseUpdateClientSchema = baseClientSchema.partial();

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

@Controller('api/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(@AccountId() accountId: string): Promise<ClientDto[]> {
    return this.clientsService.list(accountId);
  }

  @Get(':id')
  findOne(@AccountId() accountId: string, @Param('id') id: string): Promise<ClientDto> {
    return this.clientsService.findOne(accountId, id);
  }

  @Post()
  create(@AccountId() accountId: string, @Body() body: unknown): Promise<ClientDto> {
    const input: CreateClientInput = parseBody(createClientSchema, body);
    return this.clientsService.create(accountId, input);
  }

  @Put(':id')
  async update(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<ClientDto> {
    const bodyCountry =
      typeof body === 'object' && body !== null && 'country' in body
        ? (body as { country?: unknown }).country
        : undefined;
    const fallbackCountry =
      typeof bodyCountry === 'string'
        ? undefined
        : (await this.clientsService.findOne(accountId, id)).country;
    const schema = withCountryFieldPatterns(baseUpdateClientSchema, fallbackCountry);
    const input: UpdateClientInput = parseBody(schema, body);
    return this.clientsService.update(accountId, id, input);
  }

  @Delete(':id')
  async remove(
    @AccountId() accountId: string,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.clientsService.remove(accountId, id);
    return { success: true };
  }
}
