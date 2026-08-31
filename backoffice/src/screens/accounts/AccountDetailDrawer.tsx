import { Descriptions, Drawer } from 'antd';
import { useAccountDetail } from '../../hooks/useAccountDetail';
import { formatDate } from '../../utils/date';

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
