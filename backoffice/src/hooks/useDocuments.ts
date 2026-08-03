import { useMemo } from 'react';
import { listDocuments } from '../data/documents';
import type { AdminDocumentSummary, DocumentListFilters } from '../types/admin';

export function useDocuments(filters: DocumentListFilters): {
  data: AdminDocumentSummary[];
  isLoading: boolean;
} {
  const data = useMemo(() => listDocuments(filters), [filters]);
  return { data, isLoading: false };
}
