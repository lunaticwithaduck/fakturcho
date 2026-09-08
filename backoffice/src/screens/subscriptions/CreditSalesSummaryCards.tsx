import type { CreditSalesSummary } from '@fakturcho/shared-types';
import { Card, Col, Row, Statistic } from 'antd';
import { formatCents } from '../../utils/money';

interface CreditSalesSummaryCardsProps {
  summary: CreditSalesSummary;
}

export function CreditSalesSummaryCards({ summary }: CreditSalesSummaryCardsProps) {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card>
          <Statistic title="Продадени общо" value={formatCents(summary.soldAllTimeCents)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Продадени този месец" value={formatCents(summary.soldThisMonthCents)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Покупки общо" value={summary.purchasesAllTime} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="Покупки този месец" value={summary.purchasesThisMonth} />
        </Card>
      </Col>
    </Row>
  );
}
