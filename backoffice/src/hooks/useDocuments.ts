import type { AdminDocumentSummary, DocumentListFilters } from '@fakturcho/shared-types';
import { useListAdminDocumentsQuery } from '../api';

export function useDocuments(filters: DocumentListFilters): {
  data: AdminDocumentSummary[];
  isLoading: boolean;
  isError: boolean;
} {
  const { data, isLoading, isError } = useListAdminDocumentsQuery(filters);
  return { data: data ?? [], isLoading, isError };
}
