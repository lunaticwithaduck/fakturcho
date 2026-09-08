import type { AdminDocumentSummary, DocumentListFilters } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const documentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAdminDocuments: builder.query<AdminDocumentSummary[], DocumentListFilters>({
      query: (filters) => ({ url: API_ROUTES.adminDocuments, params: filters }),
      providesTags: [listTag('Document')],
    }),
  }),
});

export const { useListAdminDocumentsQuery } = documentsApi;
