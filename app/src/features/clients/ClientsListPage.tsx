'use client';

import { useDeleteClientMutation, useListClientsQuery } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { ConfirmDialog } from '@app/features/shared/ConfirmDialog';
import { Button, EmptyState, Input, Plus, Skeleton, toast } from '@design/components';
import type { ClientDto } from '@shared/types';
import { useMemo, useState } from 'react';
import { ClientFormDialog } from './ClientFormDialog';
import { ClientRow } from './ClientRow';

type DialogState = { mode: 'create' } | { mode: 'edit'; client: ClientDto } | null;

export function ClientsListPage() {
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
      toast({ title: 'Клиентът е изтрит' });
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
        <h1 className="text-2xl font-bold text-text">Клиенти</h1>
        <Button iconLeft={Plus} onClick={() => setDialogState({ mode: 'create' })}>
          Нов клиент
        </Button>
      </div>

      <Input
        label="Търсене"
        placeholder="Търсене по фирма или ЕИК"
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
          title="Нямате клиенти"
          description="Добавете първия си клиент, за да го използвате при съставяне на документи."
          action={
            <Button iconLeft={Plus} size="sm" onClick={() => setDialogState({ mode: 'create' })}>
              Нов клиент
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
            toast({ title: 'Клиентът е запазен' });
            setDialogState(null);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Изтриване на клиент"
          description={`Сигурни ли сте, че искате да изтриете "${pendingDelete.companyName}"? Действието е необратимо.`}
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
