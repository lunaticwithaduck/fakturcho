import { API_ROUTES } from '@fakturcho/shared-types';
import type {
  DocumentDto,
  DocumentListItemDto,
  DocumentListQuery,
  IssueDocumentRequest,
  SaveDraftRequest,
  SeriesInfoDto,
} from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { idTag, listTag, provideList } from '../base/tags';
import { toApiPath } from '../base/url';

export interface DocumentListResponse {
  items: DocumentListItemDto[];
  total: number;
}

export const documentsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listDocuments: builder.query<DocumentListResponse, DocumentListQuery | undefined>({
      query: (params) =>
        params ? { url: toApiPath(API_ROUTES.documents), params } : toApiPath(API_ROUTES.documents),
      providesTags: (result) => provideList('Document', result?.items),
    }),
    getDocument: builder.query<DocumentDto, string>({
      query: (id) => toApiPath(API_ROUTES.document(id)),
      providesTags: (_result, _error, id) => [idTag('Document', id)],
    }),
    saveDraft: builder.mutation<DocumentDto, SaveDraftRequest>({
      query: (body) => ({ url: toApiPath(API_ROUTES.documents), method: 'POST', body }),
      invalidatesTags: [listTag('Document')],
    }),
    updateDraft: builder.mutation<DocumentDto, { id: string; body: SaveDraftRequest }>({
      query: ({ id, body }) => ({ url: toApiPath(API_ROUTES.document(id)), method: 'PUT', body }),
      invalidatesTags: (_result, _error, arg) => [idTag('Document', arg.id), listTag('Document')],
    }),
    issueDocument: builder.mutation<DocumentDto, { id: string; body: IssueDocumentRequest }>({
      query: ({ id, body }) => ({
        url: toApiPath(API_ROUTES.documentIssue(id)),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        idTag('Document', arg.id),
        listTag('Document'),
        listTag('Series'),
        listTag('CreditBalance'),
        listTag('CreditLedger'),
      ],
    }),
    cancelDocument: builder.mutation<DocumentDto, string>({
      query: (id) => ({ url: toApiPath(API_ROUTES.documentCancel(id)), method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [idTag('Document', id), listTag('Document')],
    }),
    markDocumentPaid: builder.mutation<DocumentDto, string>({
      query: (id) => ({ url: toApiPath(API_ROUTES.documentMarkPaid(id)), method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [idTag('Document', id), listTag('Document')],
    }),
    listSeries: builder.query<SeriesInfoDto[], void>({
      query: () => toApiPath(API_ROUTES.series),
      providesTags: [listTag('Series')],
    }),
  }),
});

export const {
  useListDocumentsQuery,
  useGetDocumentQuery,
  useSaveDraftMutation,
  useUpdateDraftMutation,
  useIssueDocumentMutation,
  useCancelDocumentMutation,
  useMarkDocumentPaidMutation,
  useListSeriesQuery,
} = documentsApi;

export function getDocumentRenderUrl(id: string): string {
  return API_ROUTES.documentRender(id);
}

/** Same PDF, served `inline` so a browser viewer shows it instead of downloading it. */
export function getDocumentPreviewUrl(id: string): string {
  return `${API_ROUTES.documentRender(id)}?disposition=inline`;
}
