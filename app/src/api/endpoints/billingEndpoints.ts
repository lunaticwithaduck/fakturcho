import { API_ROUTES } from '@fakturcho/shared-types';
import type {
  CheckoutRequest,
  CheckoutSessionDto,
  CreditBalanceDto,
  CreditLedgerEntryDto,
  SubscriptionDto,
} from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { listTag } from '../base/tags';
import { toApiPath } from '../base/url';

export const billingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCreditBalance: builder.query<CreditBalanceDto, void>({
      query: () => toApiPath(API_ROUTES.creditBalance),
      providesTags: [listTag('CreditBalance')],
    }),
    getCreditLedger: builder.query<CreditLedgerEntryDto[], void>({
      query: () => toApiPath(API_ROUTES.creditLedger),
      providesTags: [listTag('CreditLedger')],
    }),
    getSubscription: builder.query<SubscriptionDto | null, void>({
      query: () => toApiPath(API_ROUTES.subscription),
      providesTags: [listTag('Subscription')],
    }),
    createCheckout: builder.mutation<CheckoutSessionDto, CheckoutRequest>({
      query: (body) => ({ url: toApiPath(API_ROUTES.checkout), method: 'POST', body }),
    }),
  }),
});

export const {
  useCreateCheckoutMutation,
  useGetCreditBalanceQuery,
  useGetCreditLedgerQuery,
  useGetSubscriptionQuery,
} = billingApi;
