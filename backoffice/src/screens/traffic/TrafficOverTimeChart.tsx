import { Line } from '@ant-design/plots';
import type { TrafficSeriesPoint } from '@fakturcho/shared-types';
import { Card, Typography } from 'antd';
import { formatDate } from '../../utils/date';

interface TrafficOverTimeChartProps {
  series: TrafficSeriesPoint[];
}

export function TrafficOverTimeChart({ series }: TrafficOverTimeChartProps) {
  const data = series.flatMap((point) => [
    { date: formatDate(point.date), type: 'Посетители', value: point.visitors },
    { date: formatDate(point.date), type: 'Показвания', value: point.pageviews },
  ]);

  return (
    <Card style={{ marginBottom: 16 }}>
      <Typography.Title level={5}>Трафик във времето</Typography.Title>
      {data.length === 0 ? (
        <Typography.Text type="secondary">Няма данни за този период.</Typography.Text>
      ) : (
        <Line data={data} xField="date" yField="value" colorField="type" height={280} />
      )}
    </Card>
  );
}
