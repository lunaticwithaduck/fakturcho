import { formatMoney } from '@app/features/shared/format';
import { Card } from '@design/components';
import type { CreditBalanceDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { balanceCaption } from './billingDisplay';

interface BalanceCardProps {
  balance: CreditBalanceDto;
}

export function BalanceCard({ balance }: BalanceCardProps) {
  const t = useTranslations('billing');
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-medium text-text-muted">{t('balance.label')}</p>
      <p className="text-2xl font-bold text-text">{formatMoney(balance.balanceCents)}</p>
      <p className="text-sm text-text-muted">{balanceCaption(balance, t)}</p>
    </Card>
  );
}
