'use client';

import { Button, Card, toast } from '@design/components';
import type { IssuerProfileDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { IssuerBankFields } from './IssuerBankFields';
import { IssuerCompanyFields } from './IssuerCompanyFields';
import { IssuerPaymentTermsFields } from './IssuerPaymentTermsFields';
import { IssuerProfileCompletenessHint } from './IssuerProfileCompletenessHint';
import { IssuerVatFields } from './IssuerVatFields';
import { useIssuerProfileForm } from './useIssuerProfileForm';

interface IssuerProfileFormProps {
  profile: IssuerProfileDto;
}

export function IssuerProfileForm({ profile }: IssuerProfileFormProps) {
  const t = useTranslations('issuer');
  const form = useIssuerProfileForm(profile, () => {
    toast({ title: t('savedToast') });
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">{t('title')}</h1>
      <IssuerProfileCompletenessHint profile={profile} />
      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit} noValidate>
        <Card>
          <IssuerCompanyFields
            values={form.values}
            onChange={form.setField}
            fieldErrors={form.fieldErrors}
          />
        </Card>
        <Card>
          <IssuerVatFields values={form.values} onChange={form.setField} />
        </Card>
        <Card>
          <IssuerBankFields values={form.values} onChange={form.setField} />
        </Card>
        <Card>
          <IssuerPaymentTermsFields values={form.values} onChange={form.setField} />
        </Card>
        {form.error ? <p className="text-sm font-medium text-danger">{form.error}</p> : null}
        <Button type="submit" disabled={form.isSubmitting} className="self-start">
          {form.isSubmitting ? t('saving') : t('save')}
        </Button>
      </form>
    </div>
  );
}
