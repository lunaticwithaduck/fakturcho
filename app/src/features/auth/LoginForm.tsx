'use client';

import { mapAuthErrorMessage, signIn } from '@app/auth';
import { Button, Card, Input } from '@design/components';
import type { Locale } from '@shared/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

interface LoginFormProps {
  locale?: Locale;
}

export function LoginForm({ locale = 'bg' }: LoginFormProps) {
  const t = useTranslations('login');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const signupHref = locale === 'bg' ? '/signup' : '/en/signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signIn.email({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(mapAuthErrorMessage(signInError.code));
      return;
    }
    router.push('/documents');
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
        <Input
          label={t('passwordLabel')}
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        {t('noAccount')}{' '}
        <a className="font-medium text-accent" href={signupHref}>
          {t('signupLink')}
        </a>
      </p>
    </Card>
  );
}
