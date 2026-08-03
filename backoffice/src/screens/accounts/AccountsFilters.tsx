import { SUBSCRIPTION_STATUSES } from '@fakturcho/shared-types';
import { Flex, Input, Select } from 'antd';
import type { SubscriptionStatusFilter } from '../../types/admin';
import { SUBSCRIPTION_STATUS_LABELS } from '../../utils/statusLabels';

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
    label: SUBSCRIPTION_STATUS_LABELS[status],
  })),
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
