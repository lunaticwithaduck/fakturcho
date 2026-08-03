import { API_ROUTES } from '@fakturcho/shared-types';
import type { CheckoutSessionDto, SubscriptionDto } from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { listTag } from '../base/tags';
import { toApiPath } from '../base/url';

export const billingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubscription: builder.query<SubscriptionDto, void>({
      query: () => toApiPath(API_ROUTES.subscription),
      providesTags: [listTag('Subscription')],
    }),
    createCheckout: builder.mutation<CheckoutSessionDto, void>({
      query: () => ({ url: toApiPath(API_ROUTES.checkout), method: 'POST' }),
    }),
  }),
});

export const { useGetSubscriptionQuery, useCreateCheckoutMutation } = billingApi;
