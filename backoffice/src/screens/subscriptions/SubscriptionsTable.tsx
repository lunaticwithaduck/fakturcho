import type { TableColumnsType } from 'antd';
import { Table, Tag } from 'antd';
import type { SubscriptionSummary } from '../../types/admin';
import { formatDate } from '../../utils/date';
import { formatCents } from '../../utils/money';
import { SUBSCRIPTION_STATUS_COLORS, SUBSCRIPTION_STATUS_LABELS } from '../../utils/statusLabels';

interface SubscriptionsTableProps {
  subscriptions: SubscriptionSummary[];
  loading: boolean;
}

const COLUMNS: TableColumnsType<SubscriptionSummary> = [
  { title: 'Абонат', dataIndex: 'accountName', key: 'accountName' },
  {
    title: 'Статус',
    dataIndex: 'status',
    key: 'status',
    render: (value: SubscriptionSummary['status']) => (
      <Tag color={SUBSCRIPTION_STATUS_COLORS[value]}>{SUBSCRIPTION_STATUS_LABELS[value]}</Tag>
    ),
  },
  { title: 'План', dataIndex: 'planName', key: 'planName' },
  {
    title: 'MRR',
    dataIndex: 'mrrCents',
    key: 'mrrCents',
    render: (value: number) => formatCents(value),
  },
  {
    title: 'Период до',
    dataIndex: 'currentPeriodEnd',
    key: 'currentPeriodEnd',
    render: (value: string | null) => formatDate(value),
  },
  {
    title: 'Създаден на',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => formatDate(value),
  },
];

export function SubscriptionsTable({ subscriptions, loading }: SubscriptionsTableProps) {
  return (
    <Table<SubscriptionSummary>
      rowKey="id"
      columns={COLUMNS}
      dataSource={subscriptions}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: false }}
    />
  );
}
