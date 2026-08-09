import { EmptyState } from '@design/components';
import type { CreditLedgerEntryDto } from '@shared/types';
import { LedgerEntryRow } from './LedgerEntryRow';

interface LedgerSectionProps {
  entries: readonly CreditLedgerEntryDto[];
}

export function LedgerSection({ entries }: LedgerSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-text">Последни движения</h2>
      {entries.length === 0 ? (
        <EmptyState
          title="Няма движения"
          description="Тук ще виждате всяка промяна по баланса ви — бонуси, покупки и издадени документи."
        />
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
