'use client';

import { useDeleteCatalogueItemMutation, useListCatalogueItemsQuery } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { ConfirmDialog } from '@app/features/shared/ConfirmDialog';
import { Button, EmptyState, Input, Plus, Skeleton, toast } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';
import { useMemo, useState } from 'react';
import { CatalogueFormDialog } from './CatalogueFormDialog';
import { CatalogueRow } from './CatalogueRow';

type DialogState = { mode: 'create' } | { mode: 'edit'; item: CatalogueItemDto } | null;

export function CatalogueListPage() {
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
      toast({ title: 'Артикулът е изтрит' });
      setPendingDelete(null);
    } catch (error) {
      toast({
        title: 'Неуспешно изтриване',
        description: getApiErrorMessage(error),
        variant: 'danger',
      });
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">Каталог</h1>
        <Button iconLeft={Plus} onClick={() => setDialogState({ mode: 'create' })}>
          Нов артикул
        </Button>
      </div>

      <Input
        label="Търсене"
        placeholder="Търсене по наименование"
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
          title="Нямате артикули"
          description="Добавете продукт или услуга, за да ги предлагате бързо в документите си."
          action={
            <Button iconLeft={Plus} size="sm" onClick={() => setDialogState({ mode: 'create' })}>
              Нов артикул
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
            toast({ title: 'Артикулът е запазен' });
            setDialogState(null);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Изтриване на артикул"
          description={`Сигурни ли сте, че искате да изтриете "${pendingDelete.name}"? Действието е необратимо.`}
          confirmLabel="Изтрий"
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
