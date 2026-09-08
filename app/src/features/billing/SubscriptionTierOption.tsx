import { Button, Card } from '@design/components';
import type { SubscriptionTierOption as SubscriptionTierOptionData } from './billingDisplay';

interface SubscriptionTierOptionProps {
  option: SubscriptionTierOptionData;
  buttonLabel: string;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}

export function SubscriptionTierOption({
  option,
  buttonLabel,
  pending,
  disabled,
  onSelect,
}: SubscriptionTierOptionProps) {
  return (
    <Card className="flex flex-col items-start gap-2">
      <p className="text-base font-semibold text-text">{option.title}</p>
      <p className="text-sm text-text-muted">{option.body}</p>
      <p className="text-xs text-text-muted">{option.perDocumentLabel}</p>
      <Button size="sm" disabled={disabled} onClick={onSelect}>
        {pending ? 'Пренасочване...' : buttonLabel}
      </Button>
    </Card>
  );
}
