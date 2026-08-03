'use client';

import { useSendDocumentEmailMutation } from '@app/api';
import { getApiErrorMessage } from '@app/features/shared/apiError';
import { Button, Dialog, DialogContent, DialogTitle, Input, Textarea } from '@design/components';
import type { DocumentDto } from '@shared/types';
import { type FormEvent, useState } from 'react';

interface DocumentEmailDialogProps {
  document: DocumentDto;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

export function DocumentEmailDialog({ document, onOpenChange, onSent }: DocumentEmailDialogProps) {
  const [sendEmail, { isLoading }] = useSendDocumentEmailMutation();
  const [to, setTo] = useState(document.recipient.email ?? '');
  const [message, setMessage] = useState(document.emailText ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await sendEmail({ id: document.id, body: { to, emailText: message } }).unwrap();
      onSent();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Изпращане по имейл</DialogTitle>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Имейл на получателя"
            type="email"
            required
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
          <Textarea
            label="Съобщение"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Отказ
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Изпращане...' : 'Изпрати'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
