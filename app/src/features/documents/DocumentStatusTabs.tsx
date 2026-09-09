'use client';

import { Tabs, TabsList, TabsTrigger } from '@design/components';
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUSES } from '@fakturcho/shared-types';
import type { DocumentStatus } from '@shared/types';
import { useTranslations } from 'next-intl';

export type StatusFilter = DocumentStatus | 'all';

interface DocumentStatusTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function DocumentStatusTabs({ value, onChange }: DocumentStatusTabsProps) {
  const t = useTranslations('documents.statusTabs');

  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as StatusFilter)}>
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="all">{t('all')}</TabsTrigger>
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
