import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from '@fakturcho/shared-types';
import type { TableColumnsType } from 'antd';
import { Table, Tag } from 'antd';
import type { AdminDocumentSummary } from '../../types/admin';
import { formatDate } from '../../utils/date';
import { formatCents } from '../../utils/money';
import { DOCUMENT_STATUS_COLORS } from '../../utils/statusLabels';

interface DocumentsTableProps {
  documents: AdminDocumentSummary[];
  loading: boolean;
}

const COLUMNS: TableColumnsType<AdminDocumentSummary> = [
  { title: 'Номер', dataIndex: 'number', key: 'number' },
  {
    title: 'Тип',
    dataIndex: 'documentType',
    key: 'documentType',
    render: (value: AdminDocumentSummary['documentType']) => DOCUMENT_TYPE_LABELS[value],
  },
  {
    title: 'Статус',
    dataIndex: 'status',
    key: 'status',
    render: (value: AdminDocumentSummary['status']) => (
      <Tag color={DOCUMENT_STATUS_COLORS[value]}>{DOCUMENT_STATUS_LABELS[value]}</Tag>
    ),
  },
  { title: 'Абонат', dataIndex: 'accountName', key: 'accountName' },
  { title: 'Получател', dataIndex: 'recipientCompanyName', key: 'recipientCompanyName' },
  {
    title: 'Сума',
    dataIndex: 'amount',
    key: 'amount',
    render: (value: number) => formatCents(value),
  },
  {
    title: 'Дата на издаване',
    dataIndex: 'issuedAt',
    key: 'issuedAt',
    render: (value: string | null) => formatDate(value),
  },
];

export function DocumentsTable({ documents, loading }: DocumentsTableProps) {
  return (
    <Table<AdminDocumentSummary>
      rowKey="id"
      columns={COLUMNS}
      dataSource={documents}
      loading={loading}
      pagination={{ pageSize: 10, showSizeChanger: false }}
    />
  );
}
