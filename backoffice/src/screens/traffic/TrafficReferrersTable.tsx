import type { TrafficReferrerRow } from '@fakturcho/shared-types';
import type { TableColumnsType } from 'antd';
import { Card, Table, Typography } from 'antd';

interface TrafficReferrersTableProps {
  referrers: TrafficReferrerRow[];
}

const COLUMNS: TableColumnsType<TrafficReferrerRow> = [
  { title: 'Източник', dataIndex: 'referrer', key: 'referrer' },
  { title: 'Посетители', dataIndex: 'visitors', key: 'visitors' },
  { title: 'Показвания', dataIndex: 'pageviews', key: 'pageviews' },
];

export function TrafficReferrersTable({ referrers }: TrafficReferrersTableProps) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Typography.Title level={5}>Източници</Typography.Title>
      <Table<TrafficReferrerRow>
        rowKey="referrer"
        columns={COLUMNS}
        dataSource={referrers}
        pagination={false}
      />
    </Card>
  );
}
