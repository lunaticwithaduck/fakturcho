import type { CreditSalesMonth } from '@fakturcho/shared-types';
import type { TableColumnsType } from 'antd';
import { Table } from 'antd';
import { formatMonthLabel } from '../../utils/date';
import { formatCents } from '../../utils/money';

interface CreditSalesMonthsTableProps {
  months: CreditSalesMonth[];
  loading: boolean;
}

const COLUMNS: TableColumnsType<CreditSalesMonth> = [
  {
    title: 'Месец',
    dataIndex: 'month',
    key: 'month',
    render: (value: string) => formatMonthLabel(value),
  },
  {
    title: 'Продадени',
    dataIndex: 'soldCents',
    key: 'soldCents',
    render: (value: number) => formatCents(value),
  },
  { title: 'Покупки', dataIndex: 'purchases', key: 'purchases' },
];

export function CreditSalesMonthsTable({ months, loading }: CreditSalesMonthsTableProps) {
  return (
    <Table<CreditSalesMonth>
      rowKey="month"
      columns={COLUMNS}
      dataSource={months}
      loading={loading}
      pagination={false}
    />
  );
}
