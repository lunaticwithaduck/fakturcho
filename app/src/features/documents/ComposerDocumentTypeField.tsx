import { Select, SelectItem } from '@design/components';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPES } from '@fakturcho/shared-types';
import type { DocumentType } from '@shared/types';

interface ComposerDocumentTypeFieldProps {
  value: DocumentType;
  onChange: (value: DocumentType) => void;
}

export function ComposerDocumentTypeField({ value, onChange }: ComposerDocumentTypeFieldProps) {
  return (
    <Select
      label="Вид документ"
      value={value}
      onValueChange={(next) => onChange(next as DocumentType)}
    >
      {DOCUMENT_TYPES.map((type) => (
        <SelectItem key={type} value={type}>
          {DOCUMENT_TYPE_LABELS[type]}
        </SelectItem>
      ))}
    </Select>
  );
}
