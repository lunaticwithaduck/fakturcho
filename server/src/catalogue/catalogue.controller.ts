import type { CatalogueItemDto } from '@fakturcho/shared-types';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import type { CreateCatalogueItemInput, UpdateCatalogueItemInput } from './catalogue.service';
import { CatalogueService } from './catalogue.service';

const createCatalogueItemSchema = z.object({
  name: z.string().min(1),
  defaultUnitPrice: z.number().int(),
  unit: z.string().min(1),
});

const updateCatalogueItemSchema = createCatalogueItemSchema.partial();

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

@Controller('api/catalogue')
export class CatalogueController {
  constructor(private readonly catalogueService: CatalogueService) {}

  @Get()
  list(@AccountId() accountId: string): Promise<CatalogueItemDto[]> {
    return this.catalogueService.list(accountId);
  }

  @Get(':id')
  findOne(@AccountId() accountId: string, @Param('id') id: string): Promise<CatalogueItemDto> {
    return this.catalogueService.findOne(accountId, id);
  }

  @Post()
  create(@AccountId() accountId: string, @Body() body: unknown): Promise<CatalogueItemDto> {
    const input: CreateCatalogueItemInput = parseBody(createCatalogueItemSchema, body);
    return this.catalogueService.create(accountId, input);
  }

  @Put(':id')
  update(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<CatalogueItemDto> {
    const input: UpdateCatalogueItemInput = parseBody(updateCatalogueItemSchema, body);
    return this.catalogueService.update(accountId, id, input);
  }

  @Delete(':id')
  async remove(
    @AccountId() accountId: string,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    await this.catalogueService.remove(accountId, id);
    return { success: true };
  }
}
