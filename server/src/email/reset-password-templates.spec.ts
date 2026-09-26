import { PUBLISHED_LOCALES as SUPPORTED_LOCALES } from '@fakturcho/shared-types';
import { describe, expect, it } from 'vitest';
import { buildResetPasswordEmail } from './reset-password-templates';

describe('buildResetPasswordEmail', () => {
  it('includes the reset URL and a native subject for every supported locale', () => {
    const url = 'https://www.fakturcho.com/reset-password?token=abc123';
    for (const locale of SUPPORTED_LOCALES) {
      const email = buildResetPasswordEmail(locale, url);
      expect(email.subject.length).toBeGreaterThan(0);
      expect(email.text).toContain(url);
    }
  });

  it('matches the Bulgarian wording byte-for-byte', () => {
    const email = buildResetPasswordEmail('bg', 'https://www.fakturcho.com/reset-password?token=x');
    expect(email.subject).toBe('Смяна на паролата за Фактурчо');
    expect(email.text).toContain('Получихме заявка за смяна на паролата');
  });

  it('matches the English wording byte-for-byte', () => {
    const email = buildResetPasswordEmail('en', 'https://www.fakturcho.com/reset-password?token=x');
    expect(email.subject).toBe('Reset your Fakturcho password');
    expect(email.text).toContain("If you didn't ask for this");
  });

  it('produces distinct subjects across locales', () => {
    const subjects = new Set(
      SUPPORTED_LOCALES.map(
        (locale) =>
          buildResetPasswordEmail(locale, 'https://www.fakturcho.com/reset-password?token=x')
            .subject,
      ),
    );
    expect(subjects.size).toBe(SUPPORTED_LOCALES.length);
  });
});
