'use client';

import { Button, Card, Checkbox, Input, toast } from '@design/components';
import { useTranslations } from 'next-intl';
import { useChangePasswordForm } from './useChangePasswordForm';

export function ChangePasswordCard() {
  const t = useTranslations('account.changePassword');
  const form = useChangePasswordForm(() => {
    toast({ title: t('savedToast') });
  });

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <Card>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
          <h2 className="text-lg font-semibold text-text">{t('heading')}</h2>
          <Input
            label={t('currentPasswordLabel')}
            type="password"
            autoComplete="current-password"
            required
            value={form.values.currentPassword}
            onChange={(event) => form.setField('currentPassword', event.target.value)}
          />
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
            {...(form.fieldErrors.confirmPassword
              ? { error: form.fieldErrors.confirmPassword }
              : {})}
          />
          <Checkbox
            label={t('revokeOtherSessions')}
            checked={form.values.revokeOtherSessions}
            onCheckedChange={(checked) => form.setField('revokeOtherSessions', checked === true)}
          />
          {form.error ? <p className="text-sm font-medium text-danger">{form.error}</p> : null}
          <Button type="submit" disabled={form.isSubmitting} className="self-start">
            {form.isSubmitting ? t('saving') : t('save')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
