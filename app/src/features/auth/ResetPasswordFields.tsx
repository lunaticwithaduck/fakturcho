'use client';

import { Button, Card, Input } from '@design/components';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useResetPasswordForm } from './useResetPasswordForm';

interface ResetPasswordFieldsProps {
  token: string;
  loginHref: string;
}

export function ResetPasswordFields({ token, loginHref }: ResetPasswordFieldsProps) {
  const t = useTranslations('resetPassword');
  const router = useRouter();
  const form = useResetPasswordForm(token, () => {
    router.push(`${loginHref}?resetSuccess=1`);
  });

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-text">{t('title')}</h1>
        <p className="text-sm text-text-muted">{t('subtitle')}</p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
        <Input
          label={t('newPasswordLabel')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.values.newPassword}
          onChange={(event) => form.setField('newPassword', event.target.value)}
          {...(form.fieldErrors.newPassword ? { error: form.fieldErrors.newPassword } : {})}
        />
        <Input
          label={t('confirmPasswordLabel')}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.values.confirmPassword}
          onChange={(event) => form.setField('confirmPassword', event.target.value)}
          {...(form.fieldErrors.confirmPassword ? { error: form.fieldErrors.confirmPassword } : {})}
        />
        {form.error ? <p className="text-sm font-medium text-danger">{form.error}</p> : null}
        <Button type="submit" disabled={form.isSubmitting}>
          {form.isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
