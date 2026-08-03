'use client';

import { useGetIssuerProfileQuery } from '@app/api';
import { Skeleton } from '@design/components';
import { IssuerProfileForm } from './IssuerProfileForm';

export function IssuerProfilePage() {
  const { data, isLoading } = useGetIssuerProfileQuery();

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return <IssuerProfileForm profile={data} />;
}
