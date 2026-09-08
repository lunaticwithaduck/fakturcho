import { Flex, Spin } from 'antd';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useGetMeQuery } from '../api';
import { authClient } from './authClient';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const {
    data: me,
    isLoading: meLoading,
    isError: meError,
  } = useGetMeQuery(undefined, { skip: !session });
  const denied = Boolean(session) && !meLoading && (meError || me?.role !== 'admin');

  useEffect(() => {
    if (denied) {
      authClient.signOut();
    }
  }, [denied]);

  if (sessionPending || (session && meLoading)) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!session || denied) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
