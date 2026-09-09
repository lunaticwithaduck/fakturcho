'use client';

import { Tabs, TabsList, TabsTrigger } from '@design/components';
import { DOCUMENT_STATUSES, getDocumentStatusLabel } from '@fakturcho/shared-types';
import type { DocumentStatus, Locale } from '@shared/types';
import { useLocale, useTranslations } from 'next-intl';

export type StatusFilter = DocumentStatus | 'all';

interface DocumentStatusTabsProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function DocumentStatusTabs({ value, onChange }: DocumentStatusTabsProps) {
  const t = useTranslations('documents.statusTabs');
  const locale = useLocale() as Locale;

  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as StatusFilter)}>
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="all">{t('all')}</TabsTrigger>
          {DOCUMENT_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {getDocumentStatusLabel(status, locale)}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
