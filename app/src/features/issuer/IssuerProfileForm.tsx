'use client';

import { Button, Card, toast } from '@design/components';
import type { IssuerProfileDto } from '@shared/types';
import { IssuerBankFields } from './IssuerBankFields';
import { IssuerCompanyFields } from './IssuerCompanyFields';
import { IssuerProfileCompletenessHint } from './IssuerProfileCompletenessHint';
import { IssuerVatFields } from './IssuerVatFields';
import { useIssuerProfileForm } from './useIssuerProfileForm';

interface IssuerProfileFormProps {
  profile: IssuerProfileDto;
}

export function IssuerProfileForm({ profile }: IssuerProfileFormProps) {
  const form = useIssuerProfileForm(profile, () => {
    toast({ title: 'Профилът е запазен' });
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-text">Профил на издателя</h1>
      <IssuerProfileCompletenessHint profile={profile} />
      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit} noValidate>
        <Card>
          <IssuerCompanyFields values={form.values} onChange={form.setField} />
        </Card>
        <Card>
          <IssuerVatFields values={form.values} onChange={form.setField} />
        </Card>
        <Card>
          <IssuerBankFields values={form.values} onChange={form.setField} />
        </Card>
        {form.error ? <p className="text-sm font-medium text-danger">{form.error}</p> : null}
        <Button type="submit" disabled={form.isSubmitting} className="self-start">
          {form.isSubmitting ? 'Запазване...' : 'Запази профила'}
        </Button>
      </form>
    </div>
  );
}
