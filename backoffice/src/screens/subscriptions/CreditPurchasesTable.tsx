import type { CreditPurchaseRow } from '@fakturcho/shared-types';
import type { TableColumnsType } from 'antd';
import { Table } from 'antd';
import { formatDate } from '../../utils/date';
import { formatCents } from '../../utils/money';

interface CreditPurchasesTableProps {
  purchases: CreditPurchaseRow[];
  loading: boolean;
}

const COLUMNS: TableColumnsType<CreditPurchaseRow> = [
  {
    title: 'Дата',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value: string) => formatDate(value),
  },
  { title: 'Акаунт', dataIndex: 'accountName', key: 'accountName' },
  {
    title: 'Сума',
    dataIndex: 'amountCents',
    key: 'amountCents',
    render: (value: number) => formatCents(value),
  },
  {
    title: 'Revolut поръчка',
    dataIndex: 'revolutOrderId',
    key: 'revolutOrderId',
    render: (value: string | null) => value ?? '—',
  },
];

export function CreditPurchasesTable({ purchases, loading }: CreditPurchasesTableProps) {
  return (
    <Table<CreditPurchaseRow>
      rowKey="id"
      columns={COLUMNS}
      dataSource={purchases}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: false }}
    />
  );
}
