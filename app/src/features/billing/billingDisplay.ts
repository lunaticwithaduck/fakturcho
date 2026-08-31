import { CREDIT_PACK_IDS, CREDIT_PACKS, ISSUANCE_COST_CENTS } from '@fakturcho/shared-types';
import type { CreditBalanceDto, CreditLedgerReason, CreditPackId } from '@shared/types';
import { formatMoney } from '../shared/format';

export const CREDIT_LEDGER_REASON_LABELS: Record<CreditLedgerReason, string> = {
  signup_grant: 'Начален бонус',
  purchase: 'Покупка на кредити',
  issuance: 'Издаден документ',
  adjustment: 'Корекция',
};

export function balanceCaption(balance: CreditBalanceDto): string {
  if (balance.documentsRemaining === 1) return 'още 1 документ';
  return `още ${balance.documentsRemaining} документа`;
}

export interface PackOption {
  id: CreditPackId;
  priceLabel: string;
  documentsLabel: string;
}

export function getPackOptions(): PackOption[] {
  return CREDIT_PACK_IDS.map((id) => ({
    id,
    priceLabel: formatMoney(CREDIT_PACKS[id].eurCents),
    documentsLabel: `${CREDIT_PACKS[id].eurCents / ISSUANCE_COST_CENTS} документа`,
  }));
}
