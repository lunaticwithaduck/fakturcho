'use client';

import { localeForPathname } from '@app/i18n/locale';
import { toLocalePath } from '@app/i18n/localeRedirect';
import { Skeleton } from '@design/components';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuthSession } from './hooks';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isPending } = useAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(toLocalePath('/login', localeForPathname(pathname ?? '/')));
    }
  }, [isPending, session, router, pathname]);

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
