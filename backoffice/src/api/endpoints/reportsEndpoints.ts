import type { TurnoverReportRow } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listReportMonths: builder.query<string[], void>({
      query: () => API_ROUTES.adminReportsMonths,
      providesTags: [listTag('Report')],
    }),
    getTurnoverReport: builder.query<TurnoverReportRow[], string>({
      query: (month) => ({ url: API_ROUTES.adminReportsTurnover, params: { month } }),
      providesTags: [listTag('Report')],
    }),
  }),
});

export const { useListReportMonthsQuery, useGetTurnoverReportQuery } = reportsApi;
