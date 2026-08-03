import { useSession } from './authClient';

export function useAuthSession() {
  const { data, isPending, error } = useSession();
  return {
    session: data ?? null,
    isPending,
    error,
  };
}
