import { Button, Card } from '@design/components';
import { getCountryConfig } from '@fakturcho/shared-types';
import type { ClientDto } from '@shared/types';
import { useTranslations } from 'next-intl';

interface ClientRowProps {
  client: ClientDto;
  onEdit: (client: ClientDto) => void;
  onDelete: (client: ClientDto) => void;
}

export function ClientRow({ client, onEdit, onDelete }: ClientRowProps) {
  const t = useTranslations('clients');
  const { companyIdLabel } = getCountryConfig(client.country);

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-text">{client.companyName}</p>
        <p className="truncate text-sm text-text-muted">
          {[
            client.eik ? t('eikPrefix', { label: companyIdLabel, eik: client.eik }) : null,
            client.email,
          ]
            .filter(Boolean)
            .join(' · ') || '—'}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(client)}>
          {t('edit')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(client)}>
          {t('delete')}
        </Button>
      </div>
    </Card>
  );
}
