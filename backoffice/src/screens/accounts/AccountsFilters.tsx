import type { SubscriptionStatusFilter } from '@fakturcho/shared-types';
import { SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
import { Flex, Input, Select } from 'antd';
import { ACCOUNT_SUBSCRIPTION_STATUS_LABELS } from '../../utils/statusLabels';

interface AccountsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: SubscriptionStatusFilter;
  onStatusChange: (value: SubscriptionStatusFilter) => void;
}

const STATUS_OPTIONS: { value: SubscriptionStatusFilter; label: string }[] = [
  { value: 'all', label: 'Всички статуси' },
  ...SUBSCRIPTION_STATUSES.map((status) => ({
    value: status,
    label: ACCOUNT_SUBSCRIPTION_STATUS_LABELS[status],
  })),
  { value: 'none', label: ACCOUNT_SUBSCRIPTION_STATUS_LABELS.none },
];

export function AccountsFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: AccountsFiltersProps) {
  return (
    <Flex gap={12} style={{ marginBottom: 16 }} wrap>
      <Input.Search
        allowClear
        placeholder="Търсене по фирма или ЕИК"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        style={{ width: 280 }}
      />
      <Select<SubscriptionStatusFilter>
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        style={{ width: 220 }}
      />
    </Flex>
  );
}
