import { Typography } from 'antd';
import { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import type { SubscriptionStatusFilter } from '../../types/admin';
import { AccountDetailDrawer } from './AccountDetailDrawer';
import { AccountsFilters } from './AccountsFilters';
import { AccountsTable } from './AccountsTable';

export function AccountsScreen() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SubscriptionStatusFilter>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { data: accounts, isLoading } = useAccounts({ search, status });

  return (
    <div>
      <Typography.Title level={3}>Абонати</Typography.Title>
      <AccountsFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />
      <AccountsTable accounts={accounts} loading={isLoading} onSelect={setSelectedAccountId} />
      <AccountDetailDrawer
        accountId={selectedAccountId}
        onClose={() => setSelectedAccountId(null)}
      />
    </div>
  );
}
