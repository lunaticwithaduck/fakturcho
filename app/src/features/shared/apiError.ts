import bgMessages from '@messages/bg.json';
import type { DomainErrorCode } from '@shared/types';

interface ApiErrorBody {
  code?: string;
  message?: string;
}

interface FetchBaseQueryLikeError {
  status: number | string;
  data?: unknown;
}

function isFetchBaseQueryLikeError(error: unknown): error is FetchBaseQueryLikeError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function extractBody(error: unknown): ApiErrorBody | null {
  if (!isFetchBaseQueryLikeError(error)) return null;
  const { data } = error;
  if (typeof data !== 'object' || data === null) return null;
  return data as ApiErrorBody;
}

const API_ERROR_MESSAGES = bgMessages.shell.apiErrors as Record<DomainErrorCode, string>;
const DEFAULT_MESSAGE: string = bgMessages.shell.apiErrorFallback;

function isKnownCode(code: string): code is DomainErrorCode {
  return code in API_ERROR_MESSAGES;
}

export function getApiErrorCode(error: unknown): DomainErrorCode | null {
  const body = extractBody(error);
  if (!body || typeof body.code !== 'string' || !isKnownCode(body.code)) return null;
  return body.code;
}

export function getApiErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  return code ? API_ERROR_MESSAGES[code] : DEFAULT_MESSAGE;
}
