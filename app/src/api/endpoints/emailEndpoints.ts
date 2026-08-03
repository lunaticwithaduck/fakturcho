import { API_ROUTES } from '@fakturcho/shared-types';
import type { EmailDocumentRequest } from '@shared/types';
import { apiSlice } from '../base/apiSlice';
import { idTag } from '../base/tags';
import { toApiPath } from '../base/url';

export const emailApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendDocumentEmail: builder.mutation<
      { success: true },
      { id: string; body: EmailDocumentRequest }
    >({
      query: ({ id, body }) => ({
        url: toApiPath(API_ROUTES.documentEmail(id)),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [idTag('Document', arg.id)],
    }),
  }),
});

export const { useSendDocumentEmailMutation } = emailApi;
