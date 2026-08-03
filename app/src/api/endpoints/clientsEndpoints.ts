import { API_ROUTES } from '@fakturcho/shared-types';
import type { ClientDto, CreateClientRequest, UpdateClientRequest } from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { idTag, listTag, provideList } from '../base/tags';
import { toApiPath } from '../base/url';

export const clientsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listClients: builder.query<ClientDto[], void>({
      query: () => toApiPath(API_ROUTES.clients),
      providesTags: (result) => provideList('Client', result),
    }),
    getClient: builder.query<ClientDto, string>({
      query: (id) => toApiPath(API_ROUTES.client(id)),
      providesTags: (_result, _error, id) => [idTag('Client', id)],
    }),
    createClient: builder.mutation<ClientDto, CreateClientRequest>({
      query: (body) => ({ url: toApiPath(API_ROUTES.clients), method: 'POST', body }),
      invalidatesTags: [listTag('Client')],
    }),
    updateClient: builder.mutation<ClientDto, { id: string; body: UpdateClientRequest }>({
      query: ({ id, body }) => ({ url: toApiPath(API_ROUTES.client(id)), method: 'PUT', body }),
      invalidatesTags: (_result, _error, arg) => [idTag('Client', arg.id), listTag('Client')],
    }),
    deleteClient: builder.mutation<{ success: true }, string>({
      query: (id) => ({ url: toApiPath(API_ROUTES.client(id)), method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [idTag('Client', id), listTag('Client')],
    }),
  }),
});

export const {
  useListClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientsApi;
