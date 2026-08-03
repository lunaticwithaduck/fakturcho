import type {
  DocumentDto,
  DocumentListItemDto,
  DocumentListQuery,
  IssueDocumentRequest,
  SaveDraftRequest,
} from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { AccountId } from '../common/account-id.decorator';
import { DocumentIssuanceService } from './document-issuance.service';
import { DocumentsService } from './documents.service';
import {
  documentListQuerySchema,
  issueDocumentRequestSchema,
  saveDraftRequestSchema,
} from './dto-schemas';
import { parseOrThrow } from './zod-parse.util';

@Controller(API_ROUTES.documents)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly issuanceService: DocumentIssuanceService,
  ) {}

  @Post()
  create(@AccountId() accountId: string, @Body() body: unknown): Promise<DocumentDto> {
    const request = parseOrThrow(saveDraftRequestSchema, body) as SaveDraftRequest;
    return this.documentsService.saveDraft(accountId, null, request);
  }

  @Put(':id')
  update(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<DocumentDto> {
    const request = parseOrThrow(saveDraftRequestSchema, body) as SaveDraftRequest;
    return this.documentsService.saveDraft(accountId, id, request);
  }

  @Get()
  list(
    @AccountId() accountId: string,
    @Query() query: unknown,
  ): Promise<{ items: DocumentListItemDto[]; total: number }> {
    const parsed = parseOrThrow(documentListQuerySchema, query) as DocumentListQuery;
    return this.documentsService.list(accountId, parsed);
  }

  @Get(':id')
  get(@AccountId() accountId: string, @Param('id') id: string): Promise<DocumentDto> {
    return this.documentsService.get(accountId, id);
  }

  @Post(':id/issue')
  issue(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<DocumentDto> {
    const request = parseOrThrow(issueDocumentRequestSchema, body) as IssueDocumentRequest;
    return this.issuanceService.issue(accountId, id, request);
  }

  @Post(':id/cancel')
  cancel(@AccountId() accountId: string, @Param('id') id: string): Promise<DocumentDto> {
    return this.issuanceService.cancel(accountId, id);
  }

  @Post(':id/paid')
  markPaid(@AccountId() accountId: string, @Param('id') id: string): Promise<DocumentDto> {
    return this.issuanceService.markPaid(accountId, id);
  }
}
