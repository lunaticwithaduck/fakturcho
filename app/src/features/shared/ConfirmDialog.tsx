'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@design/components';
import { useTranslations } from 'next-intl';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'danger' | 'primary';
  isConfirming?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  variant = 'danger',
  isConfirming = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations('shell');

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('confirmDialog.cancel')}
            </Button>
          </DialogClose>
          <Button type="button" variant={variant} disabled={isConfirming} onClick={onConfirm}>
            {isConfirming ? t('confirmDialog.confirming') : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
