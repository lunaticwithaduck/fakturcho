import type { GetTrafficQuery, TrafficOverview } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const trafficApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTrafficOverview: builder.query<TrafficOverview, GetTrafficQuery>({
      query: (params) => ({ url: API_ROUTES.adminTraffic, params }),
      providesTags: [listTag('Traffic')],
    }),
  }),
});

export const { useGetTrafficOverviewQuery } = trafficApi;
