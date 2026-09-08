import type { AdminMeDto } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const meApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<AdminMeDto, void>({
      query: () => API_ROUTES.adminMe,
      providesTags: [listTag('Me')],
    }),
  }),
});

export const { useGetMeQuery, useLazyGetMeQuery } = meApi;
