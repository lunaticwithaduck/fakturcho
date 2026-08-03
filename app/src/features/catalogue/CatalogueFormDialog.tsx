'use client';

import { Button, Dialog, DialogClose, DialogContent, DialogTitle } from '@design/components';
import type { CatalogueItemDto } from '@shared/types';
import { CatalogueFormFields } from './CatalogueFormFields';
import { useCatalogueForm } from './catalogueForm';

interface CatalogueFormDialogProps {
  item: CatalogueItemDto | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (item: CatalogueItemDto) => void;
}

export function CatalogueFormDialog({ item, onOpenChange, onSaved }: CatalogueFormDialogProps) {
  const form = useCatalogueForm(item, (result) => {
    onSaved(result);
    onOpenChange(false);
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{item ? 'Редактиране на артикул' : 'Нов артикул'}</DialogTitle>
        <form className="flex flex-col gap-4" onSubmit={form.handleSubmit} noValidate>
          <CatalogueFormFields values={form.values} onChange={form.setField} />
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
