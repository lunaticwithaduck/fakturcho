import { Card, Col, Row, Statistic } from 'antd';
import type { UsageMonthSummary } from '../../types/admin';

interface UsageSummaryCardsProps {
  latest: UsageMonthSummary | undefined;
}

export function UsageSummaryCards({ latest }: UsageSummaryCardsProps) {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={8}>
        <Card>
          <Statistic
            title="Издадени документи (текущ месец)"
            value={latest?.documentsIssued ?? 0}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Активни акаунти" value={latest?.activeAccounts ?? 0} />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic title="Изпратени имейли" value={latest?.emailsSent ?? 0} />
        </Card>
      </Col>
    </Row>
  );
}
