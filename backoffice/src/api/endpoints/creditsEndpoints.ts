import type {
  CreditPurchaseRow,
  CreditSalesMonth,
  CreditSalesSummary,
} from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { listTag } from '../tags';

export const creditsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCreditSalesSummary: builder.query<CreditSalesSummary, void>({
      query: () => API_ROUTES.adminCreditsSummary,
      providesTags: [listTag('Credits')],
    }),
    listCreditSalesMonths: builder.query<CreditSalesMonth[], void>({
      query: () => API_ROUTES.adminCreditsMonths,
      providesTags: [listTag('Credits')],
    }),
    listCreditPurchases: builder.query<CreditPurchaseRow[], void>({
      query: () => API_ROUTES.adminCreditsPurchases,
      providesTags: [listTag('Credits')],
    }),
  }),
});

export const {
  useGetCreditSalesSummaryQuery,
  useListCreditSalesMonthsQuery,
  useListCreditPurchasesQuery,
} = creditsApi;
