import bgMessages from '@messages/bg.json';
import enMessages from '@messages/en.json';
import type { DomainErrorCode, Locale } from '@shared/types';

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

interface ShellMessages {
  apiErrors: Record<DomainErrorCode, string>;
  apiErrorFallback: string;
}

const MESSAGES_BY_LOCALE: Record<Locale, ShellMessages> = {
  bg: bgMessages.shell as ShellMessages,
  en: enMessages.shell as ShellMessages,
};

function isKnownCode(code: string, locale: Locale): code is DomainErrorCode {
  return code in MESSAGES_BY_LOCALE[locale].apiErrors;
}

export function getApiErrorCode(error: unknown, locale: Locale): DomainErrorCode | null {
  const body = extractBody(error);
  if (!body || typeof body.code !== 'string' || !isKnownCode(body.code, locale)) return null;
  return body.code;
}

export function getApiErrorMessage(error: unknown, locale: Locale): string {
  const code = getApiErrorCode(error, locale);
  const messages = MESSAGES_BY_LOCALE[locale];
  return code ? messages.apiErrors[code] : messages.apiErrorFallback;
}
