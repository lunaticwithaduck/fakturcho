import type { TableColumnsType } from 'antd';
import { Table } from 'antd';
import type { UsageMonthSummary } from '../../types/admin';
import { formatMonthLabel } from '../../utils/date';

interface UsageTableProps {
  months: UsageMonthSummary[];
  loading: boolean;
}

const COLUMNS: TableColumnsType<UsageMonthSummary> = [
  {
    title: 'Месец',
    dataIndex: 'month',
    key: 'month',
    render: (value: string) => formatMonthLabel(value),
  },
  { title: 'Издадени документи', dataIndex: 'documentsIssued', key: 'documentsIssued' },
  { title: 'Активни акаунти', dataIndex: 'activeAccounts', key: 'activeAccounts' },
  { title: 'Изпратени имейли', dataIndex: 'emailsSent', key: 'emailsSent' },
];

export function UsageTable({ months, loading }: UsageTableProps) {
  return (
    <Table<UsageMonthSummary>
      rowKey="month"
      columns={COLUMNS}
      dataSource={months}
      loading={loading}
      pagination={false}
    />
  );
}
