import type { UsageMonthSummary } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const usageApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsageMonths: builder.query<UsageMonthSummary[], void>({
      query: () => API_ROUTES.adminUsageMonths,
      providesTags: [listTag('Usage')],
    }),
  }),
});

export const { useListUsageMonthsQuery } = usageApi;
