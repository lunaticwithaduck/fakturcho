import { Card, Col, Row, Statistic } from 'antd';
import type { MrrSummary } from '../../types/admin';
import { formatCents } from '../../utils/money';

interface SubscriptionsSummaryCardsProps {
  summary: MrrSummary;
}

export function SubscriptionsSummaryCards({ summary }: SubscriptionsSummaryCardsProps) {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card>
          <Statistic title="MRR" value={formatCents(summary.mrrCents)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Активни" value={summary.activeCount} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Пробен период" value={summary.trialingCount} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Просрочени / отказани"
            value={summary.pastDueCount + summary.canceledCount}
          />
        </Card>
      </Col>
    </Row>
  );
}
