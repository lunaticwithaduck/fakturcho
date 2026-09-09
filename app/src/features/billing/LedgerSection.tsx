import { EmptyState } from '@design/components';
import type { CreditLedgerEntryDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { LedgerEntryRow } from './LedgerEntryRow';

interface LedgerSectionProps {
  entries: readonly CreditLedgerEntryDto[];
}

export function LedgerSection({ entries }: LedgerSectionProps) {
  const t = useTranslations('billing');
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">{t('ledger.heading')}</h2>
      {entries.length === 0 ? (
        <EmptyState title={t('ledger.emptyTitle')} description={t('ledger.emptyDescription')} />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <LedgerEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
