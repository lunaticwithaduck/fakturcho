import { Button } from '@design/components';
import Link from 'next/link';

interface ComposerActionsProps {
  isSubmitting: boolean;
  onSaveAndIssue: () => void;
}

export function ComposerActions({ isSubmitting, onSaveAndIssue }: ComposerActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Запазване...' : 'Запази чернова'}
      </Button>
      <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onSaveAndIssue}>
        Запази и издай
      </Button>
      <Button type="button" variant="ghost" disabled={isSubmitting} asChild>
        <Link href="/documents">Отказ</Link>
      </Button>
    </div>
  );
}
