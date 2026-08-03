import { Typography } from 'antd';
import { useUsageMonths } from '../../hooks/useUsageMonths';
import { UsageSummaryCards } from './UsageSummaryCards';
import { UsageTable } from './UsageTable';

export function UsageScreen() {
  const { data: months, isLoading } = useUsageMonths();

  return (
    <div>
      <Typography.Title level={3}>Използване</Typography.Title>
      <UsageSummaryCards latest={months[0]} />
      <UsageTable months={months} loading={isLoading} />
    </div>
  );
}
