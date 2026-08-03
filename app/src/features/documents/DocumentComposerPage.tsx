'use client';

import {
  useGetDocumentQuery,
  useGetIssuerProfileQuery,
  useListCatalogueItemsQuery,
  useListClientsQuery,
} from '@app/api';
import { Button, EmptyState, Skeleton } from '@design/components';
import { skipToken } from '@reduxjs/toolkit/query/react';
import Link from 'next/link';
import { DocumentComposerForm } from './DocumentComposerForm';

interface DocumentComposerPageProps {
  documentId?: string;
}

export function DocumentComposerPage({ documentId }: DocumentComposerPageProps) {
  const documentQuery = useGetDocumentQuery(documentId ?? skipToken);
  const { data: clients, isLoading: isLoadingClients } = useListClientsQuery();
  const { data: catalogueItems, isLoading: isLoadingCatalogue } = useListCatalogueItemsQuery();
  const { data: issuerProfile, isLoading: isLoadingIssuer } = useGetIssuerProfileQuery();

  const isLoading =
    (documentId ? documentQuery.isLoading : false) ||
    isLoadingClients ||
    isLoadingCatalogue ||
    isLoadingIssuer;

  if (isLoading || !clients || !catalogueItems || !issuerProfile) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (documentId && !documentQuery.data) {
    return (
      <EmptyState
        title="Документът не е намерен"
        action={
          <Button size="sm" asChild>
            <Link href="/documents">Към документите</Link>
          </Button>
        }
      />
    );
  }

  if (documentId && documentQuery.data && documentQuery.data.status !== 'draft') {
    return (
      <EmptyState
        title="Само чернови могат да се редактират"
        description="Този документ вече е издаден и е неизменяем. Издаден документ се коригира с кредитно или дебитно известие."
        action={
          <Button size="sm" asChild>
            <Link href={`/documents/${documentId}`}>Към документа</Link>
          </Button>
        }
      />
    );
  }

  return (
    <DocumentComposerForm
      documentId={documentId ?? null}
      existing={documentId ? (documentQuery.data ?? null) : null}
      clients={clients}
      catalogueItems={catalogueItems}
      issuerProfile={issuerProfile}
    />
  );
}
