import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const API_TAG_TYPES = [
  'IssuerProfile',
  'Client',
  'CatalogueItem',
  'Document',
  'Series',
  'Subscription',
  'CreditBalance',
  'CreditLedger',
] as const;

export type ApiTagType = (typeof API_TAG_TYPES)[number];

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: API_TAG_TYPES,
  endpoints: () => ({}),
});
