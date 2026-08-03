import { Descriptions, Drawer, Tag } from 'antd';
import { useAccountDetail } from '../../hooks/useAccountDetail';
import { formatDate } from '../../utils/date';
import { formatCents } from '../../utils/money';
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from '../../utils/statusLabels';

interface AccountDetailDrawerProps {
  accountId: string | null;
  onClose: () => void;
}

export function AccountDetailDrawer({ accountId, onClose }: AccountDetailDrawerProps) {
  const { data: account } = useAccountDetail(accountId);

  return (
    <Drawer
      title={account?.companyName ?? 'Детайли за акаунт'}
      open={accountId !== null}
      onClose={onClose}
      width={480}
    >
      {account ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="ЕИК">{account.eik}</Descriptions.Item>
          <Descriptions.Item label="ДДС номер">{account.vatNumber ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="МОЛ">{account.mol}</Descriptions.Item>
          <Descriptions.Item label="Адрес">
            {account.addressLine}, {account.city}
          </Descriptions.Item>
          <Descriptions.Item label="Телефон">{account.phone}</Descriptions.Item>
          <Descriptions.Item label="Имейл">{account.email}</Descriptions.Item>
          <Descriptions.Item label="IBAN">{account.iban}</Descriptions.Item>
          <Descriptions.Item label="BIC">{account.bic}</Descriptions.Item>
          <Descriptions.Item label="Абонамент">
            <Tag color={SUBSCRIPTION_STATUS_COLORS[account.subscriptionStatus]}>
              {SUBSCRIPTION_STATUS_LABELS[account.subscriptionStatus]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="План">{account.planName}</Descriptions.Item>
          <Descriptions.Item label="MRR">{formatCents(account.mrrCents)}</Descriptions.Item>
          <Descriptions.Item label="Текущ период до">
            {formatDate(account.currentPeriodEnd)}
          </Descriptions.Item>
          <Descriptions.Item label="Издадени документи">
            {account.documentsIssued}
          </Descriptions.Item>
          <Descriptions.Item label="Регистриран на">
            {formatDate(account.createdAt)}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
}
