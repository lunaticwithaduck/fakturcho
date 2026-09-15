'use client';

import type { FeatureFlagsDto } from '@shared/types';
import { createContext, type ReactNode, useContext } from 'react';

const ALL_OFF: FeatureFlagsDto = { EN_LOCALE: false, EINVOICE: false, PEPPOL: false };

const FeatureFlagsContext = createContext<FeatureFlagsDto>(ALL_OFF);

export function FeatureFlagsProvider({
  flags,
  children,
}: {
  flags: FeatureFlagsDto;
  children: ReactNode;
}) {
  return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags(): FeatureFlagsDto {
  return useContext(FeatureFlagsContext);
}
