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

const MESSAGES_BY_CODE: Record<DomainErrorCode, string> = {
  NUMBER_COLLISION: 'Номерът вече се използва. Опитайте отново.',
  SERIES_OVERRIDE_LOCKED: 'Поредицата вече има издадени документи — следващият номер е фиксиран.',
  DOCUMENT_IMMUTABLE: 'Издаден документ не може да бъде променян.',
  ORIGINAL_DOCUMENT_REQUIRED: 'Изберете оригиналния документ, за да продължите.',
  ISSUER_PROFILE_INCOMPLETE:
    'Профилът на издателя не е попълнен. Допълнете фирмените данни, за да издавате документи.',
  VAT_GROUND_NOT_ALLOWED: 'Този избор на основание за неначисляване на ДДС не е разрешен.',
  CLIENT_EIK_DUPLICATE: 'Вече има клиент с този ЕИК.',
  SUBSCRIPTION_REQUIRED: 'Нужен е активен абонамент.',
  VALIDATION_FAILED: 'Проверете въведените данни.',
  NOT_FOUND: 'Записът не е намерен.',
  UNAUTHORIZED: 'Нямате достъп.',
};

const DEFAULT_MESSAGE = 'Възникна грешка. Опитайте отново.';

function isKnownCode(code: string): code is DomainErrorCode {
  return code in MESSAGES_BY_CODE;
}

export function getApiErrorCode(error: unknown): DomainErrorCode | null {
  const body = extractBody(error);
  if (!body || typeof body.code !== 'string' || !isKnownCode(body.code)) return null;
  return body.code;
}

export function getApiErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  return code ? MESSAGES_BY_CODE[code] : DEFAULT_MESSAGE;
}
