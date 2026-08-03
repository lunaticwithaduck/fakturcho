import { Input } from '@design/components';
import type { DocumentType } from '@shared/types';

interface ComposerDetailsFieldsProps {
  documentType: DocumentType;
  referenceNumber: string;
  taxEventAt: string;
  dueAt: string;
  validUntil: string;
  onChange: (patch: {
    referenceNumber?: string;
    taxEventAt?: string;
    dueAt?: string;
    validUntil?: string;
  }) => void;
}

export function ComposerDetailsFields({
  documentType,
  referenceNumber,
  taxEventAt,
  dueAt,
  validUntil,
  onChange,
}: ComposerDetailsFieldsProps) {
  const isQuote = documentType === 'quote';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label="Референтен номер"
        value={referenceNumber}
        onChange={(event) => onChange({ referenceNumber: event.target.value })}
      />
      {isQuote ? (
        <Input
          label="Валидно до"
          type="date"
          value={validUntil}
          onChange={(event) => onChange({ validUntil: event.target.value })}
        />
      ) : (
        <>
          <Input
            label="Данъчно събитие"
            type="date"
            value={taxEventAt}
            onChange={(event) => onChange({ taxEventAt: event.target.value })}
          />
          <Input
            label="Падеж"
            type="date"
            value={dueAt}
            onChange={(event) => onChange({ dueAt: event.target.value })}
          />
        </>
      )}
    </div>
  );
}
