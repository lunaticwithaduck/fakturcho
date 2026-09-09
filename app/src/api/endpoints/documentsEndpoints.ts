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

export interface EinvoiceReadinessResult {
  ready: boolean;
  missingFields: string[];
}

export type EinvoiceTransmissionStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'REJECTED';

export interface EinvoiceTransmissionDto {
  documentId: string;
  status: EinvoiceTransmissionStatus;
  provider: string;
  providerMessageId: string | null;
  receipt: string | null;
  errorText: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

function einvoiceReadinessRoute(id: string): string {
  return `${API_ROUTES.document(id)}/einvoice/readiness`;
}

function einvoiceXmlRoute(id: string): string {
  return `${API_ROUTES.document(id)}/einvoice/xml`;
}

function einvoiceSendRoute(id: string): string {
  return `${API_ROUTES.document(id)}/einvoice/send`;
}

function einvoiceTransmissionRoute(id: string): string {
  return `${API_ROUTES.document(id)}/einvoice/transmission`;
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
    getEinvoiceReadiness: builder.query<EinvoiceReadinessResult, string>({
      query: (id) => toApiPath(einvoiceReadinessRoute(id)),
      providesTags: (_result, _error, id) => [idTag('Document', id)],
    }),
    getEinvoiceTransmission: builder.query<EinvoiceTransmissionDto | null, string>({
      query: (id) => toApiPath(einvoiceTransmissionRoute(id)),
      providesTags: (_result, _error, id) => [idTag('Document', id)],
    }),
    sendEinvoicePeppol: builder.mutation<EinvoiceTransmissionDto, string>({
      query: (id) => ({ url: toApiPath(einvoiceSendRoute(id)), method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [idTag('Document', id)],
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
  useGetEinvoiceReadinessQuery,
  useGetEinvoiceTransmissionQuery,
  useSendEinvoicePeppolMutation,
} = documentsApi;

export function getDocumentRenderUrl(id: string): string {
  return API_ROUTES.documentRender(id);
}

/** Same PDF, served `inline` so a browser viewer shows it instead of downloading it. */
export function getDocumentPreviewUrl(id: string): string {
  return `${API_ROUTES.documentRender(id)}?disposition=inline`;
}

export function getEinvoiceXmlUrl(id: string): string {
  return einvoiceXmlRoute(id);
}
