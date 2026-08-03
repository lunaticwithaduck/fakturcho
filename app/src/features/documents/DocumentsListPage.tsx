'use client';

import { useListDocumentsQuery } from '@app/api';
import { Button, EmptyState, Input, Skeleton } from '@design/components';
import type { DocumentType } from '@shared/types';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DocumentListItemCard } from './DocumentListItemCard';
import { DocumentStatusTabs, type StatusFilter } from './DocumentStatusTabs';
import { DocumentTypeFilterSelect } from './DocumentTypeFilterSelect';

export function DocumentsListPage() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [documentType, setDocumentType] = useState<DocumentType | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useListDocumentsQuery({
    ...(status !== 'all' ? { status } : {}),
    ...(documentType !== 'all' ? { documentType } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    pageSize: 50,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const hasFilters = status !== 'all' || documentType !== 'all' || search.trim() !== '';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">Документи</h1>
        <Button asChild>
          <Link href="/documents/new">Нов документ</Link>
        </Button>
      </div>

      <DocumentStatusTabs value={status} onChange={setStatus} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DocumentTypeFilterSelect value={documentType} onChange={setDocumentType} />
        <Input
          label="Търсене"
          placeholder="Търсене по клиент или референция"
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
          title="Нямате документи"
          description={
            hasFilters
              ? 'Няма документи, отговарящи на филтрите.'
              : 'Създайте първия си документ, за да го видите тук.'
          }
          action={
            <Button size="sm" asChild>
              <Link href="/documents/new">Нов документ</Link>
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
