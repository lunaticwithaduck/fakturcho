import type { TableColumnsType } from 'antd';
import { Table } from 'antd';
import type { TurnoverReportRow } from '../../types/admin';
import { formatCents } from '../../utils/money';

interface TurnoverReportTableProps {
  rows: TurnoverReportRow[];
  loading: boolean;
}

const COLUMNS: TableColumnsType<TurnoverReportRow> = [
  { title: 'Абонат', dataIndex: 'accountName', key: 'accountName' },
  { title: 'Издадени документи', dataIndex: 'documentsIssued', key: 'documentsIssued' },
  {
    title: 'Оборот',
    dataIndex: 'turnoverCents',
    key: 'turnoverCents',
    render: (value: number) => formatCents(value),
  },
];

export function TurnoverReportTable({ rows, loading }: TurnoverReportTableProps) {
  const totalDocuments = rows.reduce((sum, row) => sum + row.documentsIssued, 0);
  const totalTurnover = rows.reduce((sum, row) => sum + row.turnoverCents, 0);

  return (
    <Table<TurnoverReportRow>
      rowKey="accountId"
      columns={COLUMNS}
      dataSource={rows}
      loading={loading}
      pagination={false}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>Общо</Table.Summary.Cell>
          <Table.Summary.Cell index={1}>{totalDocuments}</Table.Summary.Cell>
          <Table.Summary.Cell index={2}>{formatCents(totalTurnover)}</Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  );
}
