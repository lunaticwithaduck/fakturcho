'use client';

import { Tabs, TabsList, TabsTrigger } from '@design/components';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUSES } from '@fakturcho/shared-types';
import type { DocumentStatus } from '@shared/types';

export type StatusFilter = DocumentStatus | 'all';

interface DocumentStatusTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function DocumentStatusTabs({ value, onChange }: DocumentStatusTabsProps) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as StatusFilter)}>
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="all">Всички</TabsTrigger>
          {DOCUMENT_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {DOCUMENT_STATUS_LABELS[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
