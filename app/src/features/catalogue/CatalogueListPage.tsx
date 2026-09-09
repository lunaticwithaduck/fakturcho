'use client';

import { useDeleteCatalogueItemMutation, useListCatalogueItemsQuery } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { ConfirmDialog } from '@app/features/shared/ConfirmDialog';
import { Button, EmptyState, Input, Plus, Skeleton, toast } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { CatalogueFormDialog } from './CatalogueFormDialog';
import { CatalogueRow } from './CatalogueRow';

type DialogState = { mode: 'create' } | { mode: 'edit'; item: CatalogueItemDto } | null;

export function CatalogueListPage() {
  const t = useTranslations('catalogue');
  const { data, isLoading } = useListCatalogueItemsQuery();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCatalogueItemMutation();
  const [search, setSearch] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogueItemDto | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter((item) => item.name.toLowerCase().includes(query));
  }, [data, search]);

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteItem(pendingDelete.id).unwrap();
      toast({ title: t('deleteToastTitle') });
      setPendingDelete(null);
    } catch (error) {
      toast({
        title: t('deleteErrorTitle'),
        description: getApiErrorMessage(error),
        variant: 'danger',
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">{t('pageTitle')}</h1>
        <Button iconLeft={Plus} onClick={() => setDialogState({ mode: 'create' })}>
          {t('newItem')}
        </Button>
      </div>

      <Input
        label={t('searchLabel')}
        placeholder={t('searchPlaceholder')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button iconLeft={Plus} size="sm" onClick={() => setDialogState({ mode: 'create' })}>
              {t('newItem')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <CatalogueRow
              key={item.id}
              item={item}
              onEdit={(target) => setDialogState({ mode: 'edit', item: target })}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {dialogState ? (
        <CatalogueFormDialog
          key={dialogState.mode === 'edit' ? dialogState.item.id : 'create'}
          item={dialogState.mode === 'edit' ? dialogState.item : null}
          onOpenChange={(open) => {
            if (!open) setDialogState(null);
          }}
          onSaved={() => {
            toast({ title: t('saveToastTitle') });
            setDialogState(null);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={t('deleteDialogTitle')}
          description={t('deleteDialogDescription', { name: pendingDelete.name })}
          confirmLabel={t('delete')}
          isConfirming={isDeleting}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
