import type {
  MrrSummary,
  SubscriptionStatusFilter,
  SubscriptionSummary,
} from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const subscriptionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listSubscriptions: builder.query<SubscriptionSummary[], SubscriptionStatusFilter>({
      query: (status) => ({
        url: API_ROUTES.adminSubscriptions,
        params: { status: status === 'none' ? 'all' : status },
      }),
      providesTags: [listTag('Subscription')],
    }),
    getMrrSummary: builder.query<MrrSummary, void>({
      query: () => API_ROUTES.adminSubscriptionsSummary,
      providesTags: [listTag('Subscription')],
    }),
  }),
});

export const { useListSubscriptionsQuery, useGetMrrSummaryQuery } = subscriptionsApi;
