import type { TableColumnsType } from 'antd';
import { Table, Tag } from 'antd';
import type { AccountSummary } from '../../types/admin';
import { formatDate } from '../../utils/date';
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from '../../utils/statusLabels';

interface AccountsTableProps {
  accounts: AccountSummary[];
  loading: boolean;
  onSelect: (accountId: string) => void;
}

const COLUMNS: TableColumnsType<AccountSummary> = [
  { title: 'Фирма', dataIndex: 'companyName', key: 'companyName' },
  { title: 'ЕИК', dataIndex: 'eik', key: 'eik' },
  { title: 'Град', dataIndex: 'city', key: 'city' },
  {
    title: 'ДДС регистрация',
    dataIndex: 'vatRegistered',
    key: 'vatRegistered',
    render: (value: boolean) => (value ? <Tag color="blue">Да</Tag> : <Tag>Не</Tag>),
  },
  { title: 'Издадени документи', dataIndex: 'documentsIssued', key: 'documentsIssued' },
  {
    title: 'Абонамент',
    dataIndex: 'subscriptionStatus',
    key: 'subscriptionStatus',
    render: (status: AccountSummary['subscriptionStatus']) => (
      <Tag color={SUBSCRIPTION_STATUS_COLORS[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Tag>
    ),
  },
  {
    title: 'Регистриран на',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => formatDate(value),
  },
];

export function AccountsTable({ accounts, loading, onSelect }: AccountsTableProps) {
  return (
    <Table<AccountSummary>
      rowKey="id"
      columns={COLUMNS}
      dataSource={accounts}
      loading={loading}
      onRow={(record) => ({ onClick: () => onSelect(record.id), style: { cursor: 'pointer' } })}
      pagination={{ pageSize: 10, showSizeChanger: false }}
    />
  );
}
