import type { AdminFeatureFlagDto, FeatureFlagKey } from '@fakturcho/shared-types';
import { API_ROUTES } from '@fakturcho/shared-types';
import { api } from '../api';
import { idTag, listTag } from '../tags';

export const featureFlagsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listFeatureFlags: builder.query<AdminFeatureFlagDto[], void>({
      query: () => API_ROUTES.adminFeatureFlags,
      providesTags: (result) =>
        result
          ? [...result.map((flag) => idTag('FeatureFlags', flag.key)), listTag('FeatureFlags')]
          : [listTag('FeatureFlags')],
    }),
    updateFeatureFlag: builder.mutation<
      AdminFeatureFlagDto,
      { key: FeatureFlagKey; enabled: boolean }
    >({
      query: ({ key, enabled }) => ({
        url: API_ROUTES.adminFeatureFlag(key),
        method: 'PUT',
        body: { enabled },
      }),
      async onQueryStarted({ key, enabled }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          featureFlagsApi.util.updateQueryData('listFeatureFlags', undefined, (draft) => {
            const flag = draft.find((entry) => entry.key === key);
            if (flag) flag.enabled = enabled;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, _error, { key }) => [idTag('FeatureFlags', key)],
    }),
  }),
});

export const { useListFeatureFlagsQuery, useUpdateFeatureFlagMutation } = featureFlagsApi;
