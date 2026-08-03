'use client';

import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from '@design/components';
import type { ClientDto } from '@shared/types';
import { ClientFormFields } from './ClientFormFields';
import { useClientForm } from './clientForm';

interface ClientFormDialogProps {
  client: ClientDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (client: ClientDto) => void;
}

export function ClientFormDialog({ client, onOpenChange, onSaved }: ClientFormDialogProps) {
  const form = useClientForm(client, (result) => {
    onSaved(result);
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{client ? 'Редактиране на клиент' : 'Нов клиент'}</DialogTitle>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
          <ClientFormFields values={form.values} onChange={form.setField} />
          {form.error ? <p className="text-sm font-medium text-danger">{form.error}</p> : null}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Отказ
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.isSubmitting}>
              {form.isSubmitting ? 'Запазване...' : 'Запази'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
