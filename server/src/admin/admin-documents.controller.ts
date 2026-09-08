import type { AdminDocumentSummary } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { parseOrThrow } from '../documents/zod-parse.util';
import { AdminGuard } from './admin.guard';
import { AdminDocumentsService } from './admin-documents.service';
import { adminDocumentListQuerySchema } from './dto-schemas';

@UseGuards(AdminGuard)
@Controller(API_ROUTES.adminDocuments)
export class AdminDocumentsController {
  constructor(private readonly service: AdminDocumentsService) {}

  @Get()
  list(@Query() query: unknown): Promise<AdminDocumentSummary[]> {
    const parsed = parseOrThrow(adminDocumentListQuerySchema, query);
    return this.service.list({
      search: parsed.search ?? '',
      documentType: parsed.documentType ?? 'all',
      status: parsed.status ?? 'all',
    });
  }
}
