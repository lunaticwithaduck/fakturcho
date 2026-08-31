import { formatDate, formatMoney } from '@app/features/shared/format';
import { Button, Dialog, DialogContent, DialogTitle } from '@design/components';
import type { WiseTransferInstructionsDto } from '@shared/types';

interface WiseTransferDialogProps {
  instructions: WiseTransferInstructionsDto;
  onOpenChange: (open: boolean) => void;
}

export function WiseTransferDialog({ instructions, onOpenChange }: WiseTransferDialogProps) {
  const fields: { label: string; value: string }[] = [
    { label: 'Сума', value: formatMoney(instructions.amountCents) },
    { label: 'IBAN', value: instructions.iban },
    { label: 'Получател', value: instructions.accountHolderName },
    ...(instructions.bic ? [{ label: 'BIC', value: instructions.bic }] : []),
    { label: 'Номер за препращане (задължителен)', value: instructions.reference },
  ];

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Нареждане по банков път</DialogTitle>
        <p className="text-sm text-text-muted">
          Направете превод към сметката по-долу с посочения номер за препращане — задължително
          включете го, за да разпознаем плащането ви автоматично.
        </p>
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-0.5">
              <p className="text-xs font-medium text-text-muted">{field.label}</p>
              <p className="select-all font-mono text-sm text-text">{field.value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted">
          Валидно до {formatDate(instructions.expiresAt)}. Кредитите се начисляват автоматично след
          получаване на превода — обикновено в рамките на 1 работен ден.
        </p>
        <div className="flex justify-end">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Готово
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
