'use client';

import { Skeleton } from '@design/components';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuthSession } from './hooks';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isPending } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace('/login');
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
