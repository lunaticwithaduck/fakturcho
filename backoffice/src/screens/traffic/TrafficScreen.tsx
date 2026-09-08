import { Flex, Select, Typography } from 'antd';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTrafficOverview } from '../../hooks/useTrafficOverview';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { TrafficDevicesTable } from './TrafficDevicesTable';
import { TrafficNotConnectedAlert } from './TrafficNotConnectedAlert';
import { TrafficOverTimeChart } from './TrafficOverTimeChart';
import { TrafficPagesTable } from './TrafficPagesTable';
import { TrafficReferrersTable } from './TrafficReferrersTable';
import { TrafficStatCards } from './TrafficStatCards';
import { DEFAULT_PERIOD, isPeriodPreset, PERIOD_OPTIONS, periodToRange } from './trafficPeriods';

export function TrafficScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');
  const period = isPeriodPreset(periodParam) ? periodParam : DEFAULT_PERIOD;
  const range = useMemo(() => periodToRange(period), [period]);
  const { data, isLoading, isError } = useTrafficOverview(range);

  return (
    <div>
      <Flex justify="space-between" align="center" wrap style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Трафик
        </Typography.Title>
        <Flex gap={12} align="center">
          {data.dashboardUrl ? (
            <a href={data.dashboardUrl} target="_blank" rel="noreferrer">
              Пълен Umami dashboard
            </a>
          ) : null}
          <Select
            value={period}
            onChange={(value) => setSearchParams({ period: value })}
            options={PERIOD_OPTIONS}
            style={{ width: 160 }}
          />
        </Flex>
      </Flex>
      {isError ? <ApiErrorAlert /> : null}
      {!isError && !data.connected ? <TrafficNotConnectedAlert /> : null}
      <TrafficStatCards data={data} loading={isLoading} />
      <TrafficOverTimeChart series={data.series} />
      <TrafficReferrersTable referrers={data.referrers} />
      <TrafficPagesTable pages={data.pages} />
      <TrafficDevicesTable devices={data.devices} />
    </div>
  );
}
