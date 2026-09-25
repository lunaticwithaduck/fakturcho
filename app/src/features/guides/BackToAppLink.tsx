'use client';

import { useAuthSession } from '@app/auth/hooks';
import { Button } from '@design/components';
import Link from 'next/link';

export function BackToAppLink({ label }: { label: string }) {
  const { session } = useAuthSession();
  if (!session) return null;
  return (
    <div>
      <Button variant="secondary" size="sm" asChild>
        <Link href="/documents">← {label}</Link>
      </Button>
    </div>
  );
}
