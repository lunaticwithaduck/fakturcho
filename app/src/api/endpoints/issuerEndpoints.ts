import { API_ROUTES } from '@fakturcho/shared-types';
import type { IssuerProfileDto, UpdateIssuerProfileRequest } from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { toApiPath } from '../base/url';

export const issuerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIssuerProfile: builder.query<IssuerProfileDto, void>({
      query: () => toApiPath(API_ROUTES.issuerProfile),
      providesTags: ['IssuerProfile'],
    }),
    updateIssuerProfile: builder.mutation<IssuerProfileDto, UpdateIssuerProfileRequest>({
      query: (body) => ({
        url: toApiPath(API_ROUTES.issuerProfile),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['IssuerProfile'],
    }),
  }),
});

export const { useGetIssuerProfileQuery, useUpdateIssuerProfileMutation } = issuerApi;
