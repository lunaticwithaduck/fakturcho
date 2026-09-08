import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const API_TAG_TYPES = [
  'Me',
  'Account',
  'Document',
  'Subscription',
  'Usage',
  'Report',
] as const;
export type ApiTagType = (typeof API_TAG_TYPES)[number];

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? '',
    credentials: 'include',
  }),
  tagTypes: API_TAG_TYPES,
  endpoints: () => ({}),
});
