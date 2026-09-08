import type { TrafficPageRow } from '@fakturcho/shared-types';
import type { TableColumnsType } from 'antd';
import { Card, Table, Typography } from 'antd';

interface TrafficPagesTableProps {
  pages: TrafficPageRow[];
}

const COLUMNS: TableColumnsType<TrafficPageRow> = [
  { title: 'Страница', dataIndex: 'path', key: 'path' },
  { title: 'Показвания', dataIndex: 'pageviews', key: 'pageviews' },
  { title: 'Уникални посетители', dataIndex: 'uniqueVisitors', key: 'uniqueVisitors' },
];

export function TrafficPagesTable({ pages }: TrafficPagesTableProps) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Typography.Title level={5}>Топ страници</Typography.Title>
      <Table<TrafficPageRow>
        rowKey="path"
        columns={COLUMNS}
        dataSource={pages}
        pagination={false}
      />
    </Card>
  );
}
