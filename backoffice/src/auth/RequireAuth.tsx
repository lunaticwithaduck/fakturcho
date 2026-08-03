import type { ReactElement } from 'react';
import { Navigate } from 'react-router';
import { isAuthenticated } from './authStorage';

interface RequireAuthProps {
  children: ReactElement;
}

export function RequireAuth({ children }: RequireAuthProps): ReactElement {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
