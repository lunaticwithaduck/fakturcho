import type {
  CreditBalanceDto,
  CreditLedgerEntryDto,
  WiseTransferInstructionsDto,
} from '@fakturcho/shared-types';
import { Body, Controller, Get, Headers, Logger, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import { parseOrThrow } from '../documents/zod-parse.util';
import { CreditsService } from './credits.service';
import { checkoutRequestSchema } from './dto-schemas';
import { WiseService } from './wise.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@Controller('api/billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly creditsService: CreditsService,
    private readonly wiseService: WiseService,
  ) {}

  @Get('credits')
  getCreditBalance(@AccountId() accountId: string): Promise<CreditBalanceDto> {
    return this.creditsService.getBalance(accountId);
  }

  @Get('credits/ledger')
  getCreditLedger(@AccountId() accountId: string): Promise<CreditLedgerEntryDto[]> {
    return this.creditsService.getLedger(accountId);
  }

  @Post('checkout')
  createCheckout(
    @AccountId() accountId: string,
    @Body() body: unknown,
  ): Promise<WiseTransferInstructionsDto> {
    const request = parseOrThrow(checkoutRequestSchema, body);
    return this.wiseService.createTransferInstructions(accountId, request.product);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest,
    @Headers('x-signature-sha256') signature: string | undefined,
  ): Promise<{ received: true }> {
    this.logger.log(
      `Wise webhook hit: signature=${signature ? 'present' : 'absent'} headers=${JSON.stringify(req.headers)} bodyLen=${req.rawBody?.length ?? 0}`,
    );
    // Wise's own "verify this URL" reachability check (dashboard setup, and creating a
    // subscription via the API) sends an unsigned probe expecting a bare 2xx — it never carries
    // this header. A real event delivery always does. Treat an unsigned request as that harmless
    // ping: acknowledge it, do nothing. Nothing here ever grants credit without a verified
    // signature — reconciliation only happens below, past the signature check.
    if (!signature) {
      return { received: true };
    }
    const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(req.body);
    if (!this.wiseService.verifyWebhookSignature(rawBody, signature)) {
      throw new DomainError('UNAUTHORIZED', 'Invalid Wise webhook signature');
    }
    await this.wiseService.handleBalanceUpdateWebhook(JSON.parse(rawBody));
    return { received: true };
  }
}
