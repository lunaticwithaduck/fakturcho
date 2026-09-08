import type { TrafficOverview } from '@fakturcho/shared-types';
import { Card, Col, Row, Statistic } from 'antd';
import { formatDurationMmSs } from './trafficFormat';

interface TrafficStatCardsProps {
  data: TrafficOverview;
  loading: boolean;
}

export function TrafficStatCards({ data, loading }: TrafficStatCardsProps) {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="Посетители" value={data.visitors} loading={loading} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="Уникални" value={data.uniqueVisitors} loading={loading} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="Показвания" value={data.pageviews} loading={loading} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic title="Отпадане %" value={data.bounceRatePct} suffix="%" loading={loading} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8} lg={4}>
        <Card>
          <Statistic
            title="Средна продължителност"
            value={formatDurationMmSs(data.avgDurationSec)}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
}
