import type { EmailDocumentRequest } from '@fakturcho/shared-types';
import { Body, Controller, Param, Post } from '@nestjs/common';
import { z } from 'zod';
import { AccountId } from '../common/account-id.decorator';
import { DomainError } from '../common/domain-error';
import { EmailService } from './email.service';

const emailDocumentSchema = z.object({
  to: z.string().email(),
  emailText: z.string(),
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

@Controller('api/documents')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post(':id/email')
  async sendEmail(
    @AccountId() accountId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<{ success: true }> {
    const input: EmailDocumentRequest = parseBody(emailDocumentSchema, body);
    await this.emailService.sendDocumentEmail(accountId, id, input);
    return { success: true };
  }
}
