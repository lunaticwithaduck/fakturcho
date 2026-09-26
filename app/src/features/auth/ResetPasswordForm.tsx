'use client';

import { toLocalePath } from '@app/i18n/localeRedirect';
import { Card } from '@design/components';
import type { Locale } from '@shared/types';
import { useTranslations } from 'next-intl';
import { ResetPasswordFields } from './ResetPasswordFields';

interface ResetPasswordFormProps {
  locale?: Locale;
  token: string | null;
  invalidToken?: boolean;
}

export function ResetPasswordForm({
  locale = 'bg',
  token,
  invalidToken = false,
}: ResetPasswordFormProps) {
  const t = useTranslations('resetPassword');
  const loginHref = toLocalePath('/login', locale);
  const forgotPasswordHref = toLocalePath('/forgot-password', locale);

  if (!token || invalidToken) {
    return (
      <Card className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">{t('invalidTitle')}</h1>
        <p className="text-sm text-text-muted">{t('invalidMessage')}</p>
        <a className="text-center text-sm font-medium text-accent" href={forgotPasswordHref}>
          {t('requestNewLink')}
        </a>
      </Card>
    );
  }

  return <ResetPasswordFields token={token} loginHref={loginHref} />;
}
