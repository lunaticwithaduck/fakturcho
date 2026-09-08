import type { TrafficDeviceRow } from '@fakturcho/shared-types';
import type { TableColumnsType } from 'antd';
import { Card, Table, Typography } from 'antd';

interface TrafficDevicesTableProps {
  devices: TrafficDeviceRow[];
}

const COLUMNS: TableColumnsType<TrafficDeviceRow> = [
  { title: 'Устройство', dataIndex: 'device', key: 'device' },
  { title: 'Посетители', dataIndex: 'visitors', key: 'visitors' },
];

export function TrafficDevicesTable({ devices }: TrafficDevicesTableProps) {
  return (
    <Card style={{ marginBottom: 16 }}>
      <Typography.Title level={5}>Устройства</Typography.Title>
      <Table<TrafficDeviceRow>
        rowKey="device"
        columns={COLUMNS}
        dataSource={devices}
        pagination={false}
      />
    </Card>
  );
}
