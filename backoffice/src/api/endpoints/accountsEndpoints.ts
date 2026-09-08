import type { AccountDetail, AccountListFilters, AccountSummary } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { idTag, listTag } from '../tags';

export const accountsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAccounts: builder.query<AccountSummary[], AccountListFilters>({
      query: (filters) => ({ url: API_ROUTES.adminAccounts, params: filters }),
      providesTags: [listTag('Account')],
    }),
    getAccount: builder.query<AccountDetail, string>({
      query: (id) => API_ROUTES.adminAccount(id),
      providesTags: (_result, _error, id) => [idTag('Account', id)],
    }),
  }),
});

export const { useListAccountsQuery, useGetAccountQuery } = accountsApi;
