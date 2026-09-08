import type { SubscriptionStatusFilter } from '@fakturcho/shared-types';
import { SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
import { Select, Typography } from 'antd';
import { useState } from 'react';
import { useMrrSummary } from '../../hooks/useMrrSummary';
import { useSubscriptions } from '../../hooks/useSubscriptions';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { SUBSCRIPTION_STATUS_LABELS } from '../../utils/statusLabels';
import { SubscriptionsSummaryCards } from './SubscriptionsSummaryCards';
import { SubscriptionsTable } from './SubscriptionsTable';

const STATUS_OPTIONS: { value: SubscriptionStatusFilter; label: string }[] = [
  { value: 'all', label: 'Всички статуси' },
  ...SUBSCRIPTION_STATUSES.map((status) => ({
    value: status,
    label: SUBSCRIPTION_STATUS_LABELS[status],
  })),
];

export function SubscriptionsScreen() {
  const [status, setStatus] = useState<SubscriptionStatusFilter>('all');
  const { data: subscriptions, isLoading, isError: subscriptionsError } = useSubscriptions(status);
  const { data: summary, isError: summaryError } = useMrrSummary();

  return (
    <div>
      <Typography.Title level={3}>Абонаменти</Typography.Title>
      {subscriptionsError || summaryError ? <ApiErrorAlert /> : null}
      <SubscriptionsSummaryCards summary={summary} />
      <Select<SubscriptionStatusFilter>
        value={status}
        onChange={setStatus}
        options={STATUS_OPTIONS}
        style={{ width: 220, marginBottom: 16 }}
      />
      <SubscriptionsTable subscriptions={subscriptions} loading={isLoading} />
    </div>
  );
}
