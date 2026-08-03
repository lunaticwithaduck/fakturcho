import { Button } from '@design/components';
import type { DocumentStatus } from '@shared/types';
import Link from 'next/link';

interface DocumentActionBarProps {
  documentId: string;
  status: DocumentStatus;
  isMarkingPaid: boolean;
  onIssue: () => void;
  onMarkPaid: () => void;
  onCancel: () => void;
  onEmail: () => void;
}

export function DocumentActionBar({
  documentId,
  status,
  isMarkingPaid,
  onIssue,
  onMarkPaid,
  onCancel,
  onEmail,
}: DocumentActionBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {status === 'draft' ? (
        <>
          <Button variant="secondary" asChild>
            <Link href={`/documents/${documentId}/edit`}>Редактирай</Link>
          </Button>
          <Button onClick={onIssue}>Издай</Button>
        </>
      ) : null}
      {status === 'sent' || status === 'overdue' ? (
        <Button onClick={onMarkPaid} disabled={isMarkingPaid}>
          {isMarkingPaid ? 'Отбелязване...' : 'Отбележи като платена'}
        </Button>
      ) : null}
      {status === 'sent' || status === 'overdue' || status === 'paid' ? (
        <>
          <Button variant="secondary" onClick={onEmail}>
            Изпрати по имейл
          </Button>
          <Button variant="danger" onClick={onCancel}>
            Анулирай
          </Button>
        </>
      ) : null}
    </div>
  );
}
