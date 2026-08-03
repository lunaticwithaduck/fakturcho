import { API_ROUTES } from '@fakturcho/shared-types';
import type {
  CatalogueItemDto,
  CreateCatalogueItemRequest,
  UpdateCatalogueItemRequest,
} from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { idTag, listTag, provideList } from '../base/tags';
import { toApiPath } from '../base/url';

export const catalogueApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listCatalogueItems: builder.query<CatalogueItemDto[], void>({
      query: () => toApiPath(API_ROUTES.catalogue),
      providesTags: (result) => provideList('CatalogueItem', result),
    }),
    getCatalogueItem: builder.query<CatalogueItemDto, string>({
      query: (id) => toApiPath(API_ROUTES.catalogueItem(id)),
      providesTags: (_result, _error, id) => [idTag('CatalogueItem', id)],
    }),
    createCatalogueItem: builder.mutation<CatalogueItemDto, CreateCatalogueItemRequest>({
      query: (body) => ({ url: toApiPath(API_ROUTES.catalogue), method: 'POST', body }),
      invalidatesTags: [listTag('CatalogueItem')],
    }),
    updateCatalogueItem: builder.mutation<
      CatalogueItemDto,
      { id: string; body: UpdateCatalogueItemRequest }
    >({
      query: ({ id, body }) => ({
        url: toApiPath(API_ROUTES.catalogueItem(id)),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        idTag('CatalogueItem', arg.id),
        listTag('CatalogueItem'),
      ],
    }),
    deleteCatalogueItem: builder.mutation<{ success: true }, string>({
      query: (id) => ({ url: toApiPath(API_ROUTES.catalogueItem(id)), method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        idTag('CatalogueItem', id),
        listTag('CatalogueItem'),
      ],
    }),
  }),
});

export const {
  useListCatalogueItemsQuery,
  useGetCatalogueItemQuery,
  useCreateCatalogueItemMutation,
  useUpdateCatalogueItemMutation,
  useDeleteCatalogueItemMutation,
} = catalogueApi;
