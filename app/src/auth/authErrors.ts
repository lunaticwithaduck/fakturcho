const MESSAGES_BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Грешен имейл или парола.',
  INVALID_EMAIL: 'Невалиден имейл адрес.',
  USER_NOT_FOUND: 'Грешен имейл или парола.',
  USER_ALREADY_EXISTS: 'Вече има регистриран потребител с този имейл.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Вече има регистриран потребител с този имейл.',
  PASSWORD_TOO_SHORT: 'Паролата е твърде кратка.',
  PASSWORD_TOO_LONG: 'Паролата е твърде дълга.',
};

const DEFAULT_MESSAGE = 'Възникна грешка. Опитайте отново.';

export function mapAuthErrorMessage(code?: string | null): string {
  if (!code) return DEFAULT_MESSAGE;
  return MESSAGES_BY_CODE[code] ?? DEFAULT_MESSAGE;
}
