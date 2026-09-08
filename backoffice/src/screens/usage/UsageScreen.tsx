import { Typography } from 'antd';
import { useUsageMonths } from '../../hooks/useUsageMonths';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { UsageSummaryCards } from './UsageSummaryCards';
import { UsageTable } from './UsageTable';

export function UsageScreen() {
  const { data: months, isLoading, isError } = useUsageMonths();

  return (
    <div>
      <Typography.Title level={3}>Използване</Typography.Title>
      {isError ? <ApiErrorAlert /> : null}
      <UsageSummaryCards latest={months[0]} />
      <UsageTable months={months} loading={isLoading} />
    </div>
  );
}
