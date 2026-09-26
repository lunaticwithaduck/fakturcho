'use client';

import { authClient } from '@app/auth';
import { toLocalePath } from '@app/i18n/localeRedirect';
import { Button, Card, Input } from '@design/components';
import type { Locale } from '@shared/types';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

interface ForgotPasswordFormProps {
  locale?: Locale;
}

export function ForgotPasswordForm({ locale = 'bg' }: ForgotPasswordFormProps) {
  const t = useTranslations('forgotPassword');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const loginHref = toLocalePath('/login', locale);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}${toLocalePath('/reset-password', locale)}`,
    });
    setIsSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('sentMessage')}</p>
        <a className="text-center text-sm font-medium text-accent" href={loginHref}>
          {t('backToLogin')}
        </a>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('subtitle')}</p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label={t('emailLabel')}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        <a className="font-medium text-accent" href={loginHref}>
          {t('backToLogin')}
        </a>
      </p>
    </Card>
  );
}
