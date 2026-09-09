'use client';

import { ClientFormDialog } from '@app/features/clients/ClientFormDialog';
import { Button, Select, SelectItem } from '@design/components';
import type { ClientDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const NONE_VALUE = 'none';

interface ComposerClientFieldProps {
  clientId: string | null;
  clients: readonly ClientDto[];
  onChange: (clientId: string | null) => void;
}

export function ComposerClientField({ clientId, clients, onChange }: ComposerClientFieldProps) {
  const t = useTranslations('documents');
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Select
        label={t('composer.client.label')}
        value={clientId ?? NONE_VALUE}
        onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
      >
        <SelectItem value={NONE_VALUE}>{t('composer.client.none')}</SelectItem>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.companyName}
          </SelectItem>
        ))}
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => setIsCreating(true)}
      >
        {t('composer.client.addNew')}
      </Button>
      {isCreating ? (
        <ClientFormDialog
          client={null}
          onOpenChange={(open) => {
            if (!open) setIsCreating(false);
          }}
          onSaved={(created) => {
            onChange(created.id);
            setIsCreating(false);
          }}
        />
      ) : null}
    </div>
  );
}
