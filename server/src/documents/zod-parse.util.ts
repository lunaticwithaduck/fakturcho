import type { ZodError, ZodSchema } from 'zod';
import { DomainError } from '../common/domain-error';

export function parseOrThrow<T>(schema: ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new DomainError('VALIDATION_FAILED', 'Invalid request.', formatZodError(result.error));
  }
  return result.data;
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    details[key] = [...(details[key] ?? []), issue.message];
  }
  return details;
}
