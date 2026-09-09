'use client';

import { useDeleteClientMutation, useListClientsQuery } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { ConfirmDialog } from '@app/features/shared/ConfirmDialog';
import { Button, EmptyState, Input, Plus, Skeleton, toast } from '@design/components';
import type { ClientDto } from '@shared/types';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { ClientFormDialog } from './ClientFormDialog';
import { ClientRow } from './ClientRow';

type DialogState = { mode: 'create' } | { mode: 'edit'; client: ClientDto } | null;

export function ClientsListPage() {
  const t = useTranslations('clients');
  const { data, isLoading } = useListClientsQuery();
  const [deleteClient, { isLoading: isDeleting }] = useDeleteClientMutation();
  const [search, setSearch] = useState('');
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [pendingDelete, setPendingDelete] = useState<ClientDto | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data;
    return data.filter(
      (client) =>
        client.companyName.toLowerCase().includes(query) ||
        (client.eik ?? '').toLowerCase().includes(query),
    );
  }, [data, search]);

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteClient(pendingDelete.id).unwrap();
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
          {t('newClient')}
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
              {t('newClient')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              onEdit={(target) => setDialogState({ mode: 'edit', client: target })}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      {dialogState ? (
        <ClientFormDialog
          key={dialogState.mode === 'edit' ? dialogState.client.id : 'create'}
          client={dialogState.mode === 'edit' ? dialogState.client : null}
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
          description={t('deleteDialogDescription', { name: pendingDelete.companyName })}
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
