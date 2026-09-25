'use client';

import { useGetIssuerProfileQuery, useListDocumentsQuery } from '@app/api';
import { Button, EmptyState, Input, Skeleton } from '@design/components';
import type { DocumentType } from '@shared/types';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { IssuerProfileCompletenessHint } from '../issuer/IssuerProfileCompletenessHint';
import { DocumentListItemCard } from './DocumentListItemCard';
import { DocumentStatusTabs, type StatusFilter } from './DocumentStatusTabs';
import { DocumentTypeFilterSelect } from './DocumentTypeFilterSelect';

export function DocumentsListPage() {
  const t = useTranslations('documents.list');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [documentType, setDocumentType] = useState<DocumentType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useListDocumentsQuery({
    ...(status !== 'all' ? { status } : {}),
    ...(documentType !== 'all' ? { documentType } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    pageSize: 50,
  });
  const { data: issuerProfile, isLoading: isIssuerProfileLoading } = useGetIssuerProfileQuery();

  const items = useMemo(() => data?.items ?? [], [data]);
  const hasFilters = status !== 'all' || documentType !== 'all' || search.trim() !== '';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold text-text">{t('pageTitle')}</h1>
          <span className="h-0.5 w-16 rounded-full bg-accent" aria-hidden />
        </div>
        <Button asChild>
          <Link href="/documents/new">{t('newDocument')}</Link>
        </Button>
      </div>

      {!isIssuerProfileLoading && issuerProfile ? (
        <IssuerProfileCompletenessHint profile={issuerProfile} showProfileLink />
      ) : null}

      <DocumentStatusTabs value={status} onChange={setStatus} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DocumentTypeFilterSelect value={documentType} onChange={setDocumentType} />
        <Input
          label={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          description={hasFilters ? t('emptyFilteredDescription') : t('emptyDescription')}
          action={
            <Button size="sm" asChild>
              <Link href="/documents/new">{t('newDocument')}</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((document) => (
            <DocumentListItemCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </div>
  );
}
