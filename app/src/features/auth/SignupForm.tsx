'use client';

import { mapAuthErrorMessage, signUp } from '@app/auth';
import { TARGET_COUNTRIES } from '@app/features/marketing/targetCountries';
import { trackEvent } from '@app/features/shared/analytics';
import { formatMoney } from '@app/features/shared/format';
import { Button, Card, Input, Select, SelectItem } from '@design/components';
import type { Locale } from '@shared/types';
import { EU_VAT_AREA_COUNTRIES, isEuVatAreaCountry, SIGNUP_GRANT_CENTS } from '@shared/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

const BG_SIGNUP_COUNTRIES = [
  'BG',
  ...EU_VAT_AREA_COUNTRIES.filter((country) => country !== 'BG'),
] as const;

const EN_SIGNUP_COUNTRIES = [
  ...TARGET_COUNTRIES,
  ...EU_VAT_AREA_COUNTRIES.filter(
    (country) => !(TARGET_COUNTRIES as readonly string[]).includes(country),
  ),
] as const;

interface SignupFormProps {
  locale?: Locale;
  initialCountry?: string | undefined;
}

export function SignupForm({ locale = 'bg', initialCountry }: SignupFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<string>(() => {
    if (locale === 'bg') return 'BG';
    const upper = initialCountry?.toUpperCase();
    return upper && isEuVatAreaCountry(upper) ? upper : '';
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginHref = locale === 'bg' ? '/login' : '/en/login';
  const signupCountries = locale === 'en' ? EN_SIGNUP_COUNTRIES : BG_SIGNUP_COUNTRIES;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!country) {
      setError(t('countryRequired'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const { error: signUpError } = await signUp.email({ name, email, password, country });
    setIsSubmitting(false);
    if (signUpError) {
      setError(mapAuthErrorMessage(signUpError.code));
      return;
    }
    trackEvent('signup');
    router.push('/documents');
  }

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('signupTitle')}</h1>
        <p className="text-sm text-text-muted">
          {t('signupSubtitle', { amount: formatMoney(SIGNUP_GRANT_CENTS) })}
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label={t('nameLabel')}
          type="text"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Select
          label={t('countryLabel')}
          placeholder={t('countryPlaceholder')}
          value={country}
          onValueChange={setCountry}
        >
          {signupCountries.map((code) => (
            <SelectItem key={code} value={code}>
              {t(`countries.${code}`)}
            </SelectItem>
          ))}
        </Select>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('signupSubmitting') : t('signupSubmit')}
        </Button>
      </form>
      <p className="text-center text-sm text-text-muted">
        {t('haveAccount')}{' '}
        <a className="font-medium text-accent" href={loginHref}>
          {t('loginLink')}
        </a>
      </p>
    </Card>
  );
}
