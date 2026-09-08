import type { DocumentStatusFilter, DocumentTypeFilter } from '@fakturcho/shared-types';
import { Typography } from 'antd';
import { useState } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { ApiErrorAlert } from '../../layout/ApiErrorAlert';
import { DocumentsFilters } from './DocumentsFilters';
import { DocumentsTable } from './DocumentsTable';

export function DocumentsScreen() {
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<DocumentTypeFilter>('all');
  const [status, setStatus] = useState<DocumentStatusFilter>('all');

  const { data: documents, isLoading, isError } = useDocuments({ search, documentType, status });

  return (
    <div>
      <Typography.Title level={3}>Документи</Typography.Title>
      {isError ? <ApiErrorAlert /> : null}
      <DocumentsFilters
        search={search}
        onSearchChange={setSearch}
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        status={status}
        onStatusChange={setStatus}
      />
      <DocumentsTable documents={documents} loading={isLoading} />
    </div>
  );
}
