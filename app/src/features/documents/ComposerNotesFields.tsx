import { Input, Textarea } from '@design/components';

interface ComposerNotesFieldsProps {
  notes: string;
  preparedBy: string;
  onChange: (patch: { notes?: string; preparedBy?: string }) => void;
}

export function ComposerNotesFields({ notes, preparedBy, onChange }: ComposerNotesFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <Textarea
        label="Бележки"
        value={notes}
        onChange={(event) => onChange({ notes: event.target.value })}
      />
      <Input
        label="Съставил"
        value={preparedBy}
        onChange={(event) => onChange({ preparedBy: event.target.value })}
      />
    </div>
  );
}
