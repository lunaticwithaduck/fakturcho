'use client';

import { Toaster } from '@design/components';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <Toaster />
    </Provider>
  );
}
